import type * as SelectPrimitive from '@radix-ui/react-select'
import type * as SliderPrimitive from '@radix-ui/react-slider'

import * as ShadcnSelect from '@/components/ui/select'
import { Slider as ShadcnSlider } from '@/components/ui/slider'
import {
	Switch as ShadcnSwitch,
	type SwitchProps,
} from '@/components/ui/switch'
import { Textarea as ShadcnTextarea } from '@/components/ui/textarea'
import { useFieldContext, useFormContext } from '@/hooks/use-form-context'
import { Button, type ButtonProps } from './ui/button'
import { Checkbox, type CheckboxProps } from './ui/checkbox'
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldLabel,
	FieldTitle,
} from './ui/field'
import { Input } from './ui/input'
import { Spinner } from './ui/spinner'

export function SubscribeButton({ children, disabled, ...props }: ButtonProps) {
	const form = useFormContext()

	return (
		<form.Subscribe
			selector={(state) => ({
				canSubmit: state.canSubmit,
				isSubmitting: state.isSubmitting,
			})}
		>
			{({ isSubmitting, canSubmit }) => (
				<Button type="submit" disabled={disabled ?? !canSubmit} {...props}>
					{children}
					{isSubmitting && <Spinner />}
				</Button>
			)}
		</form.Subscribe>
	)
}

export function Form(props: React.ComponentProps<'form'>) {
	const { onSubmit, ...otherFormProps } = props
	return (
		<form
			onSubmit={(event) => {
				event.preventDefault()
				event.stopPropagation()
				onSubmit?.(event)
			}}
			{...otherFormProps}
		/>
	)
}

function ErrorMessages({
	errors,
	id,
}: {
	errors: (string | { message: string })[]
	id?: string
}) {
	const errorMessages = errors.map((error) =>
		typeof error === 'string' ? { message: error } : error,
	)
	return <FieldError errors={errorMessages} id={id} />
}

export function TextField({
	inputProps,
	labelProps,
	helperText,
	fieldProps,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	inputProps: Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		'name' | 'value'
	>
	helperText?: string
	fieldProps?: React.ComponentProps<typeof Field>
}) {
	const field = useFieldContext<string | number>()

	const errors = field.state.meta.errors

	const id = inputProps.id ?? field.name

	const { onChange, onBlur, type, ...otherInputProps } = inputProps

	const errorId = errors.length ? `${id}-error` : undefined
	const helperTextId = helperText ? `${id}-helper-text` : undefined
	const ariaDescribedBy =
		errorId && helperTextId
			? `${errorId} ${helperTextId}`
			: (errorId ?? helperTextId)

	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

	return (
		<Field {...fieldProps} data-invalid={isInvalid}>
			<FieldLabel htmlFor={id} {...labelProps} />
			<Input
				onChange={(e) => {
					if (type === 'number') {
						field.handleChange(e.target.valueAsNumber)
					} else {
						field.handleChange(e.target.value)
					}
					onChange?.(e)
				}}
				name={field.name}
				onBlur={(e) => {
					field.handleBlur()

					onBlur?.(e)
				}}
				{...otherInputProps}
				type={type}
				id={id}
				value={field.state.value}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={ariaDescribedBy}
			/>
			{helperText && (
				<FieldDescription id={helperTextId}>{helperText}</FieldDescription>
			)}
			<ErrorMessages id={errorId} errors={errors} />
		</Field>
	)
}

export function TextAreaField({
	inputProps,
	labelProps,
	helperText,
	fieldProps,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	inputProps: Omit<
		React.TextareaHTMLAttributes<HTMLTextAreaElement>,
		'name' | 'value'
	>
	helperText?: string
	fieldProps?: React.ComponentProps<typeof Field>
}) {
	const field = useFieldContext<string | number>()

	const errors = field.state.meta.errors

	const id = inputProps.id ?? field.name

	const { onChange, onBlur, ...otherInputProps } = inputProps

	const errorId = errors.length ? `${id}-error` : undefined
	const helperTextId = helperText ? `${id}-helper-text` : undefined
	const ariaDescribedBy =
		errorId && helperTextId
			? `${errorId} ${helperTextId}`
			: (errorId ?? helperTextId)

	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

	return (
		<Field {...fieldProps} data-invalid={isInvalid}>
			<FieldLabel htmlFor={id} {...labelProps} />
			<ShadcnTextarea
				name={field.name}
				onChange={(e) => {
					field.handleChange(e.target.value)
					onChange?.(e)
				}}
				onBlur={(e) => {
					field.handleBlur()

					onBlur?.(e)
				}}
				{...otherInputProps}
				value={field.state.value}
				id={id}
				aria-invalid={isInvalid}
				aria-describedby={ariaDescribedBy}
			/>
			{helperText && (
				<FieldDescription id={helperTextId}>{helperText}</FieldDescription>
			)}
			{isInvalid && <ErrorMessages errors={errors} id={errorId} />}
		</Field>
	)
}

export function CustomField({
	helperText,
	children,
	labelProps,
	fieldProps,
}: {
	labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>
	children: (props: {
		id: string
		'aria-describedby'?: string
		'aria-invalid'?: boolean
	}) => React.ReactNode
	helperText?: string
	fieldProps?: React.ComponentProps<typeof Field>
}) {
	const field = useFieldContext<string>()

	const errors = field.state.meta.errors

	const id = field.name
	const errorId = errors.length ? `${id}-error` : undefined
	const helperTextId = helperText ? `${id}-helper-text` : undefined
	const ariaDescribedBy =
		errorId && helperTextId
			? `${errorId} ${helperTextId}`
			: (errorId ?? helperTextId)

	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

	return (
		<Field {...fieldProps} data-invalid={isInvalid}>
			{labelProps && <FieldLabel htmlFor={id} {...labelProps} />}
			{children({
				id,
				'aria-describedby': ariaDescribedBy,
				'aria-invalid': errorId ? true : undefined,
			})}
			{helperText && (
				<FieldDescription id={helperTextId}>{helperText}</FieldDescription>
			)}
			{isInvalid && <ErrorMessages errors={errors} id={errorId} />}
		</Field>
	)
}

export function SelectField({
	labelProps,
	selectInputProps,
	helperText,
	selectTriggerProps,
	selectValueProps,
	children,
	fieldProps,
}: {
	children: React.ReactNode
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	selectInputProps: React.ComponentProps<typeof SelectPrimitive.Root> & {
		id?: string
	}
	selectValueProps?: SelectPrimitive.SelectValueProps &
		React.RefAttributes<HTMLSpanElement>
	selectTriggerProps?: Omit<
		SelectPrimitive.SelectTriggerProps & React.RefAttributes<HTMLButtonElement>,
		'ref'
	> &
		React.RefAttributes<HTMLButtonElement>
	helperText?: string
	fieldProps?: React.ComponentProps<typeof Field>
}) {
	const field = useFieldContext<string>()

	const errors = field.state.meta.errors

	const id = selectInputProps.id ?? field.name

	// eslint-disable-next-line @typescript-eslint/unbound-method
	const { onValueChange, ...otherSelectInputProps } = selectInputProps

	const errorId = errors.length ? `${id}-error` : undefined
	const helperTextId = helperText ? `${id}-helper-text` : undefined

	const ariaDescribedBy =
		errorId && helperTextId
			? `${errorId} ${helperTextId}`
			: (errorId ?? helperTextId)

	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

	return (
		<Field {...fieldProps} data-invalid={isInvalid}>
			<FieldLabel htmlFor={id} {...labelProps} />
			<ShadcnSelect.Select
				onValueChange={(value) => {
					field.handleChange(value)

					onValueChange?.(value)
				}}
				{...otherSelectInputProps}
				name={field.name}
				value={field.state.value}
			>
				<ShadcnSelect.SelectTrigger
					className="w-full"
					{...selectTriggerProps}
					aria-invalid={isInvalid}
					aria-describedby={ariaDescribedBy}
					onBlur={(e) => {
						field.handleBlur()

						selectTriggerProps?.onBlur?.(e)
					}}
					id={id}
				>
					<ShadcnSelect.SelectValue {...selectValueProps} />
				</ShadcnSelect.SelectTrigger>
				<ShadcnSelect.SelectContent>{children}</ShadcnSelect.SelectContent>
			</ShadcnSelect.Select>
			{helperText && (
				<FieldDescription id={helperTextId}>{helperText}</FieldDescription>
			)}
			{isInvalid && <ErrorMessages errors={errors} id={errorId} />}
		</Field>
	)
}

export function SliderField({
	labelProps,
	sliderProps,
	fieldProps,
	helperText,
}: {
	labelProps: React.HTMLAttributes<HTMLDivElement> & { title: string }
	sliderProps: React.ComponentProps<typeof SliderPrimitive.Root>
	fieldProps?: React.ComponentProps<typeof Field>
	helperText?: string
}) {
	const field = useFieldContext<number>()

	const errors = field.state.meta.errors

	const id = sliderProps?.id ?? field.name

	const errorId = errors.length ? `${id}-error` : undefined
	const helperTextId = helperText ? `${id}-helper-text` : undefined

	// eslint-disable-next-line @typescript-eslint/unbound-method
	const { onBlur, onValueChange, ...otherSliderProps } = sliderProps

	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

	const ariaDescribedBy =
		errorId && helperTextId
			? `${errorId} ${helperTextId}`
			: (errorId ?? helperTextId)

	return (
		<Field {...fieldProps} data-invalid={isInvalid}>
			<FieldTitle {...labelProps}>{labelProps.title}</FieldTitle>
			{helperText && (
				<FieldDescription id={helperTextId}>{helperText}</FieldDescription>
			)}
			<ShadcnSlider
				name={field.name}
				onBlur={(e) => {
					field.handleBlur()
					onBlur?.(e)
				}}
				onValueChange={(value) => {
					field.handleChange(value[0])
					onValueChange?.(value)
				}}
				{...otherSliderProps}
				value={[field.state.value]}
				aria-describedby={ariaDescribedBy}
				aria-invalid={isInvalid}
				id={id}
			/>
			{isInvalid && <ErrorMessages id={errorId} errors={errors} />}
		</Field>
	)
}

interface BooleanCheckboxField {
	labelProps: React.JSX.IntrinsicElements['label']
	checkboxProps: CheckboxProps & {
		value?: string
	}
	helperText?: string
	fieldProps?: React.ComponentProps<typeof Field>
	fieldContentProps?: React.ComponentProps<typeof FieldContent>
	mode?: 'boolean'
	itemId?: never
}

type ItemValue = string | number

interface ArrayCheckboxField {
	labelProps: React.JSX.IntrinsicElements['label']
	checkboxProps: CheckboxProps & {
		value?: string
	}
	helperText?: string
	fieldProps?: React.ComponentProps<typeof Field>
	fieldContentProps?: React.ComponentProps<typeof FieldContent>
	mode: 'array'
	itemId: ItemValue
}

export function CheckboxField({
	labelProps,
	checkboxProps,
	helperText,
	fieldProps,
	fieldContentProps,
	mode = 'boolean',
	itemId,
}: BooleanCheckboxField | ArrayCheckboxField) {
	const field = useFieldContext<boolean | ItemValue[]>()

	const errors = field.state.meta.errors

	const id = `${checkboxProps.id ?? field.name}${mode === 'array' && itemId ? `-${itemId}` : ''}`

	const errorId = errors.length ? `${id}-error` : undefined
	const helperTextId = helperText ? `${id}-helper-text` : undefined
	const ariaDescribedBy =
		errorId && helperTextId
			? `${errorId} ${helperTextId}`
			: (errorId ?? helperTextId)

	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
	const checked =
		mode === 'array' && itemId
			? (field.state.value as ItemValue[])?.includes?.(itemId)
			: !!field.state.value

	const { className: labelClassName, ...otherLabelProps } = labelProps

	return (
		<Field orientation="horizontal" {...fieldProps} data-invalid={isInvalid}>
			<Checkbox
				onCheckedChange={(nextChecked) => {
					checkboxProps.onCheckedChange?.(nextChecked)
					// handle array field
					if (mode === 'array') {
						if (!itemId) return
						if (nextChecked) {
							if (!(field.state.value as (string | number)[]).includes(itemId))
								field.pushValue(itemId)
						} else {
							const index = (field.state.value as ItemValue[]).indexOf(itemId)
							if (index > -1) field.removeValue(index)
						}
					}
					// handle boolean field
					else {
						field.handleChange(!!nextChecked)
					}
				}}
				onBlur={(event) => {
					field.handleBlur()
					checkboxProps.onBlur?.(event)
				}}
				{...checkboxProps}
				id={id}
				aria-invalid={errorId ? true : undefined}
				name={field.name}
				aria-describedby={ariaDescribedBy}
				checked={checked}
			/>

			<FieldContent {...fieldContentProps}>
				<FieldLabel
					htmlFor={id}
					className={labelClassName}
					{...otherLabelProps}
				/>
				{helperText && (
					<FieldDescription id={helperTextId}>{helperText}</FieldDescription>
				)}
				{isInvalid && <ErrorMessages errors={errors} id={errorId} />}
			</FieldContent>
		</Field>
	)
}

export function SwitchField({
	labelProps,
	switchProps,
	helperText,
	fieldProps,
	fieldContentProps,
}: {
	labelProps: React.JSX.IntrinsicElements['label']
	switchProps: SwitchProps
	helperText?: string
	fieldProps?: React.ComponentProps<typeof Field>
	fieldContentProps?: React.ComponentProps<typeof FieldContent>
}) {
	const field = useFieldContext<boolean>()

	const errors = field.state.meta.errors

	const id = switchProps.id ?? field.name

	const errorId = errors.length ? `${id}-error` : undefined
	const helperTextId = helperText ? `${id}-helper-text` : undefined
	const ariaDescribedBy =
		errorId && helperTextId
			? `${errorId} ${helperTextId}`
			: (errorId ?? helperTextId)

	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

	return (
		<Field orientation="horizontal" {...fieldProps} data-invalid={isInvalid}>
			<FieldContent {...fieldContentProps}>
				<FieldLabel htmlFor={id} {...labelProps} />
				{helperText && (
					<FieldDescription id={helperTextId}>{helperText}</FieldDescription>
				)}
				{isInvalid && <ErrorMessages errors={errors} id={errorId} />}
			</FieldContent>

			<ShadcnSwitch
				onCheckedChange={(state) => {
					field.handleChange(state)
					switchProps.onCheckedChange?.(state)
				}}
				onBlur={(event) => {
					field.handleBlur()
					switchProps.onBlur?.(event)
				}}
				{...switchProps}
				id={id}
				aria-invalid={errorId ? true : undefined}
				name={field.name}
				aria-describedby={ariaDescribedBy}
				checked={field.state.value}
			/>
		</Field>
	)
}
