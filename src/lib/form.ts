import { createFormHook } from '@tanstack/react-form'

import {
	CheckboxField,
	CustomField,
	SelectField,
	SliderField,
	SubscribeButton,
	SwitchField,
	TextAreaField,
	TextField,
} from '@/components/form-components'
import { fieldContext, formContext } from '@/hooks/use-form-context'

export const { useAppForm } = createFormHook({
	fieldComponents: {
		TextField,
		SelectField,
		TextAreaField,
		CheckboxField,
		SwitchField,
		SliderField,
		CustomField,
	},
	formComponents: {
		SubscribeButton,
	},
	fieldContext,
	formContext,
})

const defaultOnSubmitInvalid: UseAppFormOptions['onSubmitInvalid'] = ({
	formApi,
}) => {
	const errorMap = formApi.state.errorMap.onSubmit
	if (errorMap) {
		const inputs = Array.from(
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
			document.querySelectorAll('form input') as NodeListOf<HTMLInputElement>,
		)
		let firstInput: HTMLInputElement | undefined
		for (const input of inputs) {
			if (errorMap[input.name]) {
				firstInput = input
				break
			}
		}
		firstInput?.focus()
	}
}

type UseAppFormOptions = Parameters<typeof useAppForm>[0]
type UseAppFormReturn = ReturnType<typeof useAppForm>

export function useAppFormWithInvalid(
	options: UseAppFormOptions,
): UseAppFormReturn {
	return useAppForm({
		onSubmitInvalid: defaultOnSubmitInvalid,
		...options,
	})
}
