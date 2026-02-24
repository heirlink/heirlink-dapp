"use client";

type FormErrorsProps = {
  hasDuplicates: boolean;
  hasTokenErrors: boolean;
  hasHeirIdError: boolean;
};

export function FormErrors({
  hasDuplicates,
  hasTokenErrors,
  hasHeirIdError,
}: FormErrorsProps) {
  if (!hasDuplicates && !hasTokenErrors && !hasHeirIdError) return null;

  return (
    <>
      {hasDuplicates && (
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
          Обнаружены повторяющиеся адреса токенов. Удалите дубликаты.
        </div>
      )}
      {hasTokenErrors && (
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
          По выделенным токенам сумма долей превышает 100%. Уменьшите доли.
        </div>
      )}
      {hasHeirIdError && (
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
          ID наследника должен быть целым числом (например, 1, 2, 3).
        </div>
      )}
    </>
  );
}
