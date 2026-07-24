"""
shaagent Python CLI — thin wrapper that delegates to the bundled Node.js binary.

If Node.js is available and the bundled CJS exists, runs the Node bundle directly
for full feature parity. Falls back to a pure-Python implementation for basic operations.

Architecture:
  - Primary: delegates to bundled shaagent.cjs (Node.js)
  - Fallback: pure-Python init with Handlebars-like template substitution
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import shutil
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console

app = typer.Typer(
    name="shaagent",
    help="Scaffold production-grade multi-agent AI systems into any repository.",
    no_args_is_help=True,
)
console = Console()

# Path to the bundled Node.js CLI (packaged into the wheel)
BUNDLE_DIR = Path(__file__).parent / "bundled"
NODE_BUNDLE = BUNDLE_DIR / "shaagent.cjs"

# Valid platforms
VALID_PLATFORMS = {"opencode", "claude-code", "github-copilot", "codex", "cursor", "continue"}

# Valid skill name pattern
VALID_SKILL_NAME = re.compile(r"^[a-zA-Z0-9_-]+$")

# Core agents that are always available
CORE_AGENTS = [
    "orchestrator", "researcher", "planner", "dev", "qa", "reviewer", "reviewer-fix"
]

# Platform-specific output directories
PLATFORM_AGENT_DIRS = {
    "opencode": ".opencode/agents",
    "claude-code": ".claude/agents",
    "github-copilot": ".github/instructions",
    "codex": ".",
    "cursor": ".cursor/rules",
    "continue": ".continue/prompts",
}

PLATFORM_EXTENSIONS = {
    "opencode": ".md",
    "claude-code": ".md",
    "github-copilot": ".instructions.md",
    "codex": ".md",
    "cursor": ".mdc",
    "continue": ".md",
}


def _run_node(args: list[str]) -> int:
    """Delegate to Node.js bundle if available."""
    node = shutil.which("node")
    if node and NODE_BUNDLE.exists():
        result = subprocess.run(
            [node, str(NODE_BUNDLE), *args],
            cwd=str(Path.cwd()),
        )
        return result.returncode
    return -1  # Node not available, fall through to Python impl


def _validate_platform(platform: str) -> str:
    """Validate platform name."""
    if platform not in VALID_PLATFORMS:
        console.print(
            f"[red]Invalid platform '{platform}'. "
            f"Choose from: {', '.join(sorted(VALID_PLATFORMS))}[/red]"
        )
        raise typer.Exit(1)
    return platform


def _validate_skill_name(name: str) -> str:
    """Validate skill name to prevent path traversal."""
    if not name or len(name) > 64 or not VALID_SKILL_NAME.match(name):
        console.print(
            f"[red]Invalid skill name '{name}'. "
            "Use only alphanumeric characters, hyphens, and underscores.[/red]"
        )
        raise typer.Exit(1)
    return name


@app.command("init")
def init(
    yes: bool = typer.Option(False, "--yes", "-y", help="Skip prompts, use defaults"),
    platform: Optional[str] = typer.Option(
        None, "--platform", help="opencode|claude-code|github-copilot|codex|cursor|continue"
    ),
    dry_run: bool = typer.Option(False, "--dry-run", help="Preview without writing files"),
) -> None:
    """Initialize multi-agent setup in the current repository."""
    args = ["init"]
    if yes:
        args.append("--yes")
    if platform:
        _validate_platform(platform)
        args += ["--platform", platform]
    if dry_run:
        args.append("--dry-run")

    rc = _run_node(args)
    if rc != -1:
        raise typer.Exit(rc)

    # Pure-Python fallback
    if not yes:
        console.print(
            "[yellow]Node.js not found. Install Node 18+ for full interactive support.\n"
            "Running in non-interactive mode with defaults...[/yellow]"
        )

    _python_init(platform or "opencode", dry_run=dry_run)


@app.command("skill")
def skill(
    action: str = typer.Argument(..., help="install | list"),
    skill_name: Optional[str] = typer.Argument(None, help="Skill name to install"),
    platform: Optional[str] = typer.Option(None, "--platform"),
) -> None:
    """Manage skills for your multi-agent setup."""
    if action == "install" and skill_name:
        _validate_skill_name(skill_name)
    if platform:
        _validate_platform(platform)

    args = ["skill", action]
    if skill_name:
        args.append(skill_name)
    if platform:
        args += ["--platform", platform]

    rc = _run_node(args)
    if rc == -1:
        if action == "list":
            _python_skill_list()
        else:
            console.print(
                "[yellow]Node.js not found. Please install Node 18+ to manage skills.[/yellow]"
            )
            raise typer.Exit(1)
    else:
        raise typer.Exit(rc)


@app.command("list")
def list_agents() -> None:
    """List installed agents and skills."""
    rc = _run_node(["list"])
    if rc == -1:
        _python_list()
    else:
        raise typer.Exit(rc)


def _python_list() -> None:
    """Pure-Python fallback for list command."""
    config_path = Path.cwd() / "shaagent.config.json"
    if not config_path.exists():
        console.print("[yellow]No shaagent.config.json found. Run `shaagent init` first.[/yellow]")
        return

    config = json.loads(config_path.read_text())
    console.print(f"\n[cyan]Platform:[/cyan] {config.get('platform', 'unknown')}")
    console.print(f"[cyan]Project:[/cyan]  {config.get('project', {}).get('name', 'unknown')}")
    console.print("\n[white]Core Agents:[/white]")
    for a in config.get("agents", {}).get("core", []):
        console.print(f"  · {a}")
    optional = config.get("agents", {}).get("optional", [])
    if optional:
        console.print("\n[white]Optional Agents:[/white]")
        for a in optional:
            console.print(f"  · {a}")
    skills = config.get("skills", {}).get("installed", [])
    if skills:
        console.print("\n[white]Installed Skills:[/white]")
        for s in skills:
            console.print(f"  · {s}")
    console.print()


def _python_skill_list() -> None:
    """Pure-Python fallback for skill list command."""
    # Check if bundled skills directory exists
    skills_dir = BUNDLE_DIR / "skills"
    if skills_dir.exists():
        console.print("\n[cyan]Available skills:[/cyan]")
        for skill_dir in sorted(skills_dir.iterdir()):
            if skill_dir.is_dir() and (skill_dir / "SKILL.md").exists():
                console.print(f"  · {skill_dir.name}")
    else:
        console.print("[yellow]Skills directory not found in bundle.[/yellow]")
        console.print("[white]Available skills (built-in):[/white]")
        for skill in ["graphify", "caveman", "review", "tdd", "security-scan", "arch-review"]:
            console.print(f"  · {skill}")
    console.print()


def _python_init(platform: str, dry_run: bool = False) -> None:
    """Pure-Python init with support for all platforms."""
    console.print("\n[cyan]  ╔══════════════════════════════════════╗[/cyan]")
    console.print("[cyan]  ║        shaagent init                 ║[/cyan]")
    console.print("[cyan]  ╚══════════════════════════════════════╝[/cyan]\n")

    if dry_run:
        console.print("[yellow]  ⚡ DRY RUN — no files will be written[/yellow]\n")

    project_name = _detect_project_name()
    agent_dir = Path(PLATFORM_AGENT_DIRS.get(platform, ".opencode/agents"))
    extension = PLATFORM_EXTENSIONS.get(platform, ".md")

    written: list[str] = []

    if platform == "codex":
        # Merged file mode
        out_file = Path("AGENTS.md")
        if not dry_run:
            content = _render_merged_agents(project_name)
            out_file.write_text(content)
        written.append(str(out_file))
    else:
        # Individual files per agent
        if not dry_run:
            agent_dir.mkdir(parents=True, exist_ok=True)

        templates_dir = BUNDLE_DIR / "templates" / "generic" / "agents"
        for agent in CORE_AGENTS:
            out_file = agent_dir / f"{agent}{extension}"
            if not dry_run:
                content = _render_agent_fallback(agent, project_name, platform, templates_dir)
                out_file.write_text(content)
            written.append(str(out_file))

    # Write config
    if not dry_run:
        config = {
            "$schema": "https://shaagent.dev/schema/v1.json",
            "platform": platform,
            "model": _get_default_model(platform),
            "project": {
                "name": project_name,
                "language": [],
                "framework": [],
                "infrastructure": "",
                "cicd": "GitHub Actions",
            },
            "agents": {
                "core": CORE_AGENTS,
                "optional": [],
            },
            "skills": {"installed": []},
        }
        (Path.cwd() / "shaagent.config.json").write_text(json.dumps(config, indent=2))

    # Report
    label = "Dry run complete!" if dry_run else "Multi-agent setup complete!"
    console.print(f"\n[green]  ✅ {label}[/green]")
    file_label = "Files that would be written:" if dry_run else "Agents written:"
    console.print(f"[dim]     {file_label}[/dim]")
    for f in written:
        console.print(f"[dim]       · {f}[/dim]")
    if not dry_run:
        console.print(
            "\n[dim]     Start with: open your AI tool and ask the Orchestrator for help.[/dim]\n"
        )


def _render_agent_fallback(
    agent_name: str, project_name: str, platform: str, templates_dir: Path
) -> str:
    """Render an agent template with simple variable substitution."""
    # Try to read from bundled templates
    template_path = templates_dir / f"{agent_name}.md.hbs"
    if template_path.exists():
        content = template_path.read_text()
        # Simple Handlebars substitution
        content = content.replace("{{projectName}}", project_name)
        content = content.replace("{{model}}", _get_default_model(platform))
        content = content.replace("{{planDir}}", f".{platform.split('-')[0]}/plans")
        content = content.replace("{{reviewDir}}", f".{platform.split('-')[0]}/reviews")
        content = content.replace("{{memoryFile}}", f".{platform.split('-')[0]}/MEMORY.md")
        # Strip Handlebars conditionals (basic cleanup)
        content = re.sub(r"\{\{#if.*?\}\}", "", content)
        content = re.sub(r"\{\{/if\}\}", "", content)
        content = re.sub(r"\{\{else\}\}", "", content)
        content = re.sub(r"\{\{.*?\}\}", "", content)
        return content

    # Generate minimal placeholder
    return f"# {agent_name.replace('-', ' ').title()}\n\nAgent for project **{project_name}**.\n"


def _render_merged_agents(project_name: str) -> str:
    """Render a merged AGENTS.md for Codex platform."""
    lines = [
        f"# AGENTS.md — {project_name}",
        "",
        "> Multi-agent orchestration instructions for coding agents.",
        "> Generated by shaagent.",
        "",
        "## Agent Roles",
        "",
        "| Agent | Role |",
        "|-------|------|",
        "| Orchestrator | Owns workflow, routes tasks, synthesises results |",
        "| Researcher | Explores codebase, finds patterns |",
        "| Planner | Creates step-by-step implementation plan |",
        "| Dev | Implements code per the plan |",
        "| QA | Writes and runs tests |",
        "| Reviewer | Systematic code review |",
        "| Reviewer-Fix | Patches review findings |",
        "",
    ]
    return "\n".join(lines)


def _detect_project_name() -> str:
    """Detect project name from package.json or pyproject.toml."""
    pkg_json = Path.cwd() / "package.json"
    if pkg_json.exists():
        try:
            data = json.loads(pkg_json.read_text())
            return data.get("name", Path.cwd().name)
        except (json.JSONDecodeError, KeyError):
            pass

    pyproject = Path.cwd() / "pyproject.toml"
    if pyproject.exists():
        try:
            content = pyproject.read_text()
            match = re.search(r'name\s*=\s*"(.+?)"', content)
            if match:
                return match.group(1)
        except OSError:
            pass

    return Path.cwd().name


def _get_default_model(platform: str) -> str:
    """Return platform-appropriate default model."""
    models = {
        "opencode": "anthropic/claude-sonnet-4-20250514",
        "claude-code": "claude-sonnet-4-20250514",
        "github-copilot": "claude-sonnet-4",
        "codex": "codex-1",
        "cursor": "claude-sonnet-4",
        "continue": "anthropic/claude-sonnet-4-20250514",
    }
    return models.get(platform, "anthropic/claude-sonnet-4-20250514")


if __name__ == "__main__":
    app()
