package com.todothink.core.exception;

import com.todothink.core.result.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import javax.servlet.http.HttpServletRequest;
import javax.validation.ConstraintViolation;
import javax.validation.ConstraintViolationException;

/**
 * 对齐 Node server/src/middlewares/error.ts
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Result<Void>> handleBusiness(BusinessException ex, HttpServletRequest request) {
        int code = ex.getCode();
        HttpStatus status = HttpStatus.BAD_REQUEST;
        if (code == 401) {
            status = HttpStatus.UNAUTHORIZED;
        } else if (code == 403) {
            status = HttpStatus.FORBIDDEN;
        } else if (code == 404) {
            status = HttpStatus.NOT_FOUND;
        } else if (code == 409) {
            status = HttpStatus.CONFLICT;
        } else if (code >= 500) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        if (code >= 500) {
            log.error("[exception] business error {} {}?{} code={} message={}",
                    request.getMethod(), request.getRequestURI(), safeQuery(request), code, ex.getMessage(), ex);
        } else {
            log.warn("[exception] business error {} {}?{} code={} message={}",
                    request.getMethod(), request.getRequestURI(), safeQuery(request), code, ex.getMessage());
        }
        return ResponseEntity.status(status).body(Result.error(ex.getMessage(), code));
    }

    @ExceptionHandler({
            MethodArgumentNotValidException.class,
            BindException.class,
            ConstraintViolationException.class,
            HttpMessageNotReadableException.class,
            MissingServletRequestParameterException.class
    })
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleValidation(Exception ex, HttpServletRequest request) {
        String message = validationMessage(ex);
        log.warn("[exception] validation error {} {}?{} message={}",
                request.getMethod(), request.getRequestURI(), safeQuery(request), message);
        return Result.error(message, 400);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handleOther(Exception ex, HttpServletRequest request) {
        log.error("[exception] unhandled error {} {}?{} message={}",
                request.getMethod(), request.getRequestURI(), safeQuery(request), ex.getMessage(), ex);
        return Result.error("服务器内部错误", 500);
    }

    private String validationMessage(Exception ex) {
        if (ex instanceof MethodArgumentNotValidException) {
            MethodArgumentNotValidException manv = (MethodArgumentNotValidException) ex;
            FieldError fieldError = manv.getBindingResult().getFieldError();
            if (fieldError != null && fieldError.getDefaultMessage() != null) {
                return fieldError.getDefaultMessage();
            }
        }
        if (ex instanceof BindException) {
            BindException bindException = (BindException) ex;
            FieldError fieldError = bindException.getBindingResult().getFieldError();
            if (fieldError != null && fieldError.getDefaultMessage() != null) {
                return fieldError.getDefaultMessage();
            }
        }
        if (ex instanceof ConstraintViolationException) {
            ConstraintViolationException cve = (ConstraintViolationException) ex;
            for (ConstraintViolation<?> violation : cve.getConstraintViolations()) {
                if (violation.getMessage() != null) {
                    return violation.getMessage();
                }
            }
        }
        if (ex instanceof MissingServletRequestParameterException) {
            MissingServletRequestParameterException msrpe = (MissingServletRequestParameterException) ex;
            return "缺少参数：" + msrpe.getParameterName();
        }
        if (ex instanceof HttpMessageNotReadableException) {
            return "请求体格式错误";
        }
        return "参数错误";
    }

    private String safeQuery(HttpServletRequest request) {
        String query = request.getQueryString();
        return query == null ? "" : query;
    }
}
