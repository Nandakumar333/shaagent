/**
 * Unit tests for install-skill.ts — skill validation and installation.
 */

import { describe, it, expect } from 'vitest';
import { validateSkillName } from '../src/install-skill';

describe('install-skill', () => {
  describe('validateSkillName', () => {
    it('should accept valid skill names', () => {
      expect(validateSkillName('graphify')).toBe(true);
      expect(validateSkillName('tdd')).toBe(true);
      expect(validateSkillName('security-scan')).toBe(true);
      expect(validateSkillName('arch-review')).toBe(true);
      expect(validateSkillName('my_skill')).toBe(true);
      expect(validateSkillName('skill123')).toBe(true);
    });

    it('should reject empty strings', () => {
      expect(validateSkillName('')).toBe(false);
    });

    it('should reject names with path separators', () => {
      expect(validateSkillName('../etc/passwd')).toBe(false);
      expect(validateSkillName('..\\windows\\system32')).toBe(false);
      expect(validateSkillName('foo/bar')).toBe(false);
      expect(validateSkillName('foo\\bar')).toBe(false);
    });

    it('should reject names with dots (potential traversal)', () => {
      expect(validateSkillName('..')).toBe(false);
      expect(validateSkillName('...')).toBe(false);
      expect(validateSkillName('.hidden')).toBe(false);
    });

    it('should reject names with special characters', () => {
      expect(validateSkillName('skill name')).toBe(false); // spaces
      expect(validateSkillName('skill@name')).toBe(false); // @
      expect(validateSkillName('skill;name')).toBe(false); // semicolons
      expect(validateSkillName('skill|name')).toBe(false); // pipes
      expect(validateSkillName('$(cmd)')).toBe(false);     // command injection
    });

    it('should reject excessively long names', () => {
      const longName = 'a'.repeat(65);
      expect(validateSkillName(longName)).toBe(false);
    });

    it('should accept names at the max length boundary', () => {
      const maxName = 'a'.repeat(64);
      expect(validateSkillName(maxName)).toBe(true);
    });
  });
});
