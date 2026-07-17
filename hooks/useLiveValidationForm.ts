"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type LiveValidationErrors<TField extends string> = Partial<
  Record<TField, string>
>;

export type LiveValidationTouched<TField extends string> = Partial<
  Record<TField, boolean>
>;

type UseLiveValidationFormOptions<TFormData, TField extends string> = {
  initialValues: TFormData;
  validate: (formData: TFormData) => LiveValidationErrors<TField>;
};

type UpdateFormDataOptions<TField extends string> = {
  touchFields?: TField[];
  clearApiErrors?: TField[];
};

export function useLiveValidationForm<TFormData, TField extends string>({
  initialValues,
  validate,
}: UseLiveValidationFormOptions<TFormData, TField>) {
  const [formData, setFormData] = useState<TFormData>(initialValues);
  const [touchedFields, setTouchedFields] =
    useState<LiveValidationTouched<TField>>({});
  const [apiErrors, setApiErrors] = useState<LiveValidationErrors<TField>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    setFormData(initialValues);
    setTouchedFields({});
    setApiErrors({});
    setSubmitAttempted(false);
  }, [initialValues]);

  const validationErrors = useMemo(
    () => validate(formData),
    [formData, validate],
  );

  const errors = useMemo(() => {
    const nextErrors: LiveValidationErrors<TField> = {};
    const fields = new Set<TField>([
      ...(Object.keys(validationErrors) as TField[]),
      ...(Object.keys(apiErrors) as TField[]),
    ]);

    fields.forEach((field) => {
      if (!submitAttempted && !touchedFields[field]) {
        return;
      }

      const message = validationErrors[field] || apiErrors[field];
      if (message) {
        nextErrors[field] = message;
      }
    });

    return nextErrors;
  }, [apiErrors, submitAttempted, touchedFields, validationErrors]);

  const markFieldsTouched = useCallback((...fields: TField[]) => {
    setTouchedFields((prev) => {
      const nextState = { ...prev };
      let changed = false;

      fields.forEach((field) => {
        if (!nextState[field]) {
          nextState[field] = true;
          changed = true;
        }
      });

      return changed ? nextState : prev;
    });
  }, []);

  const clearApiFieldErrors = useCallback((...fields: TField[]) => {
    setApiErrors((prev) => {
      const nextErrors = { ...prev };
      let changed = false;

      fields.forEach((field) => {
        if (nextErrors[field]) {
          delete nextErrors[field];
          changed = true;
        }
      });

      return changed ? nextErrors : prev;
    });
  }, []);

  const mergeApiErrors = useCallback((nextErrors: LiveValidationErrors<TField>) => {
    setApiErrors((prev) => ({ ...prev, ...nextErrors }));
  }, []);

  const updateFormData = useCallback(
    (
      updater: React.SetStateAction<TFormData>,
      options?: UpdateFormDataOptions<TField>,
    ) => {
      setFormData(updater);

      if (options?.touchFields?.length) {
        markFieldsTouched(...options.touchFields);
      }

      if (options?.clearApiErrors?.length) {
        clearApiFieldErrors(...options.clearApiErrors);
      }
    },
    [clearApiFieldErrors, markFieldsTouched],
  );

  const validateBeforeSubmit = useCallback(() => {
    setSubmitAttempted(true);
    return Object.keys(validationErrors).length === 0;
  }, [validationErrors]);

  return {
    formData,
    setFormData,
    updateFormData,
    touchedFields,
    apiErrors,
    validationErrors,
    errors,
    submitAttempted,
    setSubmitAttempted,
    setApiErrors,
    markFieldsTouched,
    clearApiFieldErrors,
    mergeApiErrors,
    validateBeforeSubmit,
  };
}
