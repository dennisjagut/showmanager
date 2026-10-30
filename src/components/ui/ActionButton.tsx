import { Icon } from "./Icon";
import { SubmitButton } from "./SubmitButton";

type Action = (formData: FormData) => Promise<void>;

// A button that sends fixed values to a Server Action, e.g. { id: 3 } to delete something
export function ActionButton({
  action,
  values,
  formClassName,
  ...props
}: { action: Action; values: Record<string, string | number>; formClassName?: string } & React.ComponentProps<
  typeof SubmitButton
>) {
  return (
    <form action={action} className={formClassName}>
      {Object.entries(values).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <SubmitButton {...props} />
    </form>
  );
}

// Small ✕ button to remove an entry from a list
export function RemoveButton({
  action,
  values,
  label,
  confirm,
}: {
  action: Action;
  values: Record<string, string | number>;
  label: string;
  confirm?: string;
}) {
  return (
    <ActionButton
      action={action}
      values={values}
      confirm={confirm}
      aria-label={label}
      title={label}
      formClassName="shrink-0"
      className="btn-danger px-2 py-1.5"
    >
      <Icon name="cross" className="h-4 w-4" />
    </ActionButton>
  );
}
