import { validateParams } from "@/lib/validateParams";

/**
 * Unit tests for parameter validation utility.
 */
describe("validateParams", () => {
  describe("Required parameters", () => {
    it("should throw error for missing required string parameter", () => {
      const schema = {
        username: { type: "string" as const, required: true }
      };
      const params = {};

      expect(() => validateParams(schema, params)).toThrow(
        "Missing required parameter: username"
      );
    });

    it("should throw error for missing required number parameter", () => {
      const schema = {
        userId: { type: "number" as const, required: true }
      };
      const params = {};

      expect(() => validateParams(schema, params)).toThrow(
        "Missing required parameter: userId"
      );
    });

    it("should not throw for provided required parameter", () => {
      const schema = {
        username: { type: "string" as const, required: true }
      };
      const params = { username: "john" };

      expect(() => validateParams(schema, params)).not.toThrow();
    });
  });

  describe("Default values", () => {
    it("should apply default value for missing optional parameter", () => {
      const schema = {
        limit: { type: "number" as const, default: "10" }
      };
      const params: any = {};

      validateParams(schema, params);

      expect(params.limit).toBe("10");
    });

    it("should not apply default value if parameter is provided", () => {
      const schema = {
        limit: { type: "number" as const, default: "10" }
      };
      const params: any = { limit: 20 };

      validateParams(schema, params);

      expect(params.limit).toBe(20);
    });

    it("should apply default value for string parameter", () => {
      const schema = {
        sort: { type: "string" as const, default: "asc" }
      };
      const params: any = {};

      validateParams(schema, params);

      expect(params.sort).toBe("asc");
    });
  });

  describe("String type validation", () => {
    it("should pass for valid string", () => {
      const schema = {
        name: { type: "string" as const }
      };
      const params = { name: "John Doe" };

      expect(() => validateParams(schema, params)).not.toThrow();
    });

    it("should throw for non-string value", () => {
      const schema = {
        name: { type: "string" as const }
      };
      const params = { name: 123 };

      expect(() => validateParams(schema, params)).toThrow(
        "name must be a string"
      );
    });
  });

  describe("Number type validation", () => {
    it("should pass for valid number", () => {
      const schema = {
        age: { type: "number" as const }
      };
      const params = { age: 25 };

      expect(() => validateParams(schema, params)).not.toThrow();
    });

    it("should throw for non-number value", () => {
      const schema = {
        age: { type: "number" as const }
      };
      const params = { age: "twenty-five" };

      expect(() => validateParams(schema, params)).toThrow(
        "age must be a number"
      );
    });

    it("should throw for NaN value", () => {
      const schema = {
        age: { type: "number" as const }
      };
      const params = { age: NaN };

      expect(() => validateParams(schema, params)).toThrow(
        "age must be a number"
      );
    });

    it("should pass for negative numbers", () => {
      const schema = {
        temperature: { type: "number" as const }
      };
      const params = { temperature: -5 };

      expect(() => validateParams(schema, params)).not.toThrow();
    });

    it("should pass for zero", () => {
      const schema = {
        count: { type: "number" as const }
      };
      const params = { count: 0 };

      expect(() => validateParams(schema, params)).not.toThrow();
    });
  });

  describe("Boolean type validation", () => {
    it("should pass for true boolean", () => {
      const schema = {
        active: { type: "boolean" as const }
      };
      const params = { active: true };

      expect(() => validateParams(schema, params)).not.toThrow();
    });

    it("should pass for false boolean", () => {
      const schema = {
        active: { type: "boolean" as const }
      };
      const params = { active: false };

      expect(() => validateParams(schema, params)).not.toThrow();
    });

    it("should throw for non-boolean value", () => {
      const schema = {
        active: { type: "boolean" as const }
      };
      const params = { active: "true" };

      expect(() => validateParams(schema, params)).toThrow(
        "active must be a boolean"
      );
    });

    it("should throw for number value", () => {
      const schema = {
        active: { type: "boolean" as const }
      };
      const params = { active: 1 };

      expect(() => validateParams(schema, params)).toThrow(
        "active must be a boolean"
      );
    });
  });

  describe("Array type validation", () => {
    it("should pass for valid array", () => {
      const schema = {
        tags: { type: "array" as const }
      };
      const params = { tags: ["tag1", "tag2"] };

      expect(() => validateParams(schema, params)).not.toThrow();
    });

    it("should throw for non-array value", () => {
      const schema = {
        tags: { type: "array" as const }
      };
      const params = { tags: "tag1,tag2" };

      expect(() => validateParams(schema, params)).toThrow(
        "tags must be an array"
      );
    });

    it("should pass for empty array", () => {
      const schema = {
        tags: { type: "array" as const }
      };
      const params = { tags: [] };

      expect(() => validateParams(schema, params)).not.toThrow();
    });

    it("should validate array element types when 'of' is specified", () => {
      const schema = {
        ids: { type: "array" as const, of: "number" }
      };
      const params = { ids: [1, 2, 3] };

      expect(() => validateParams(schema, params)).not.toThrow();
    });

    it("should throw for invalid array element types", () => {
      const schema = {
        ids: { type: "array" as const, of: "number" }
      };
      const params = { ids: [1, "two", 3] };

      expect(() => validateParams(schema, params)).toThrow(
        "ids array values must be number"
      );
    });

    it("should validate string array elements", () => {
      const schema = {
        names: { type: "array" as const, of: "string" }
      };
      const params = { names: ["alice", "bob", "charlie"] };

      expect(() => validateParams(schema, params)).not.toThrow();
    });

    it("should throw for mixed type array when type is specified", () => {
      const schema = {
        names: { type: "array" as const, of: "string" }
      };
      const params = { names: ["alice", 123, "charlie"] };

      expect(() => validateParams(schema, params)).toThrow(
        "names array values must be string"
      );
    });
  });

  describe("Complex validation scenarios", () => {
    it("should validate multiple parameters with mixed types", () => {
      const schema = {
        username: { type: "string" as const, required: true },
        age: { type: "number" as const, required: true },
        active: { type: "boolean" as const },
        tags: { type: "array" as const, of: "string" },
        limit: { type: "number" as const, default: "10" }
      };
      const params: any = {
        username: "john",
        age: 30,
        active: true,
        tags: ["developer", "reader"]
      };

      validateParams(schema, params);

      expect(params.limit).toBe("10");
      expect(() => validateParams(schema, params)).not.toThrow();
    });

    it("should throw on first validation error", () => {
      const schema = {
        username: { type: "string" as const, required: true },
        age: { type: "number" as const, required: true }
      };
      const params = {};

      expect(() => validateParams(schema, params)).toThrow(
        "Missing required parameter: username"
      );
    });

    it("should handle optional parameters correctly", () => {
      const schema = {
        name: { type: "string" as const, required: true },
        description: { type: "string" as const }
      };
      const params = { name: "Test" };

      expect(() => validateParams(schema, params)).not.toThrow();
    });
  });

  describe("Edge cases", () => {
    it("should handle empty schema", () => {
      const schema = {};
      const params = { anyKey: "anyValue" };

      expect(() => validateParams(schema, params)).not.toThrow();
    });

    it("should handle empty params with non-required schema", () => {
      const schema = {
        optional: { type: "string" as const }
      };
      const params = {};

      expect(() => validateParams(schema, params)).not.toThrow();
    });

    it("should handle params with extra fields not in schema", () => {
      const schema = {
        name: { type: "string" as const }
      };
      const params = {
        name: "John",
        extraField: "extra",
        anotherField: 123
      };

      expect(() => validateParams(schema, params)).not.toThrow();
    });

    it("should throw error for unknown type", () => {
      const schema = {
        test: { type: "unknown" as any }
      };
      const params = { test: "value" };

      expect(() => validateParams(schema, params)).toThrow(
        "Unknown type: unknown"
      );
    });
  });
});
