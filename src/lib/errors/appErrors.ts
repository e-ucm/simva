/**
 * Custom error class for handling "not found" scenarios.
 * Extends the standard Error class and sets the error name to "NotFoundError".
 *
 * @class NotFoundError
 * @extends {Error}
 *
 * @example
 * throw new NotFoundError("User not found");
 */
export class NotFoundError extends Error {
  /**
   * Creates a new NotFoundError instance.
   *
   * @constructor
   * @param {string} message - The error message describing what was not found
   */
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Custom error class for handling bad request scenarios.
 * Extends the standard Error class and sets the error name to "BadRequestError".
 *
 * @class BadRequestError
 * @extends {Error}
 *
 * @example
 * throw new BadRequestError("Invalid request parameters");
 */
export class BadRequestError extends Error {
  /**
   * Creates a new BadRequestError instance.
   *
   * @constructor
   * @param {string} message - The error message describing the bad request
   */
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

/**
 * Custom error class for handling authentication failures.
 * Extends the standard Error class and sets the error name to "AuthentificationError".
 *
 * @class AuthentificationError
 * @extends {Error}
 *
 * @example
 * throw new AuthentificationError("Invalid credentials");
 */
export class AuthentificationError extends Error {
  /**
   * Creates a new AuthentificationError instance.
   *
   * @constructor
   * @param {string} message - The error message describing the authentication failure
   */
  constructor(message: string) {
    super(message);
    this.name = "AuthentificationError";
  }
}

/**
 * Custom error class for handling validation errors.
 * Extends the standard Error class and sets the error name to "ValidationError".
 *
 * @class ValidationError
 * @extends {Error}
 * @example
 * throw new ValidationError("Invalid input data");
 */
export class ValidationError extends Error {
  /**
   * Creates a new ValidationError instance.
   * @param message - The error message describing the validation issue
   */
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Custom error class for handling conflict errors.
 * Extends the standard Error class and sets the error name to "ConflictError".
 * 
 * @class ConflictError
 * @extends {Error}
 * @example
 * throw new ConflictError("Resource already exists");
 */ 
export class ConflictError extends Error {
  /**
   * Creates a new ConflictError instance.
   * @param message - The error message describing the conflict issue
   */
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}


/**
 * Custom error class for handling not implemented errors.
 * Extends the standard Error class and sets the error name to "NotImplementedError".
 * 
 * @class NotImplementedError
 * @extends {Error}
 * @example
 * throw new NotImplementedError("This method is not implemented yet");
 */
export class NotImplementedError extends Error {
  /**
   * Creates a new NotImplementedError instance.
   * @param message - The error message describing the not implemented method
   */
  constructor(message: string) {
    super(message);
    this.name = "NotImplementedError";
  }
}

export class LRSError extends Error {
  /**
   * Creates a new LRSError instance.
   * @param message - The error message describing the LRS error
   * @param originalError - The original error object for additional context
   * @example
   * throw new LRSError("Failed to flush statements to LRS", originalError);
   * This error is used to wrap errors that occur during LRS operations, providing a consistent error type for handling LRS-related issues.
   * The original error is included as a property for debugging purposes, allowing developers to access the underlying error details when handling LRSErrors.
   * This class can be extended in the future to include additional properties or methods specific to LRS errors, such as error codes or retry logic.
   * By using a custom error class for LRS errors, we can improve error handling and logging in the application, making it easier to identify and resolve issues related to LRS interactions.
   * The LRSError class can be used throughout the application wherever LRS operations are performed, ensuring that all LRS-related errors are consistently handled and logged.
   * This approach also allows for better separation of concerns, as LRS errors can be handled differently from other types of errors in the application, such as database errors or validation errors.
   * Overall, the LRSError class provides a structured way to manage errors related to LRS operations, improving the robustness and maintainability of the codebase.
   * @param message - The error message describing the LRS error
   * @param originalError - The original error object for additional context
   * @example
   * throw new LRSError("Failed to flush statements to LRS", originalError);
   * This error is used to wrap errors that occur during LRS operations, providing a consistent error type for handling LRS-related issues.
   * The original error is included as a property for debugging purposes, allowing developers to access the underlying error details when handling LRSErrors.
   */
  originalError: any;

  constructor(message: string, originalError: any) {
      super(message);
      this.name = "LRSError";
      if (originalError.response && originalError.response.data) {
				this.originalError = originalError.response.data; // Capture LRS error details if available
			} else {
        this.originalError = originalError; // Capture the original error for debugging
      }
  }
}