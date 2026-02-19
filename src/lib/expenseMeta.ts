export type ExpenseCategory = 'SALARY' | 'OTHER'

type EncodeParams = {
	category: ExpenseCategory
	comment?: string
	salaryUserId?: number
}

const CATEGORY_TAG = /\[CAT:(RENT|SALARY|OTHER)\]/i
const USER_TAG = /\[USER:(\d+)\]/i

export function encodeExpenseComment({
	category,
	comment,
	salaryUserId
}: EncodeParams) {
	const parts: string[] = [`[CAT:${category}]`]

	if (salaryUserId && Number.isFinite(salaryUserId)) {
		parts.push(`[USER:${salaryUserId}]`)
	}

	if (comment && comment.trim()) {
		parts.push(comment.trim())
	}

	return parts.join(' ')
}

export function parseExpenseComment(rawComment?: string | null) {
	const source = rawComment || ''
	const categoryMatch = source.match(CATEGORY_TAG)
	const userMatch = source.match(USER_TAG)

	const taggedCategoryRaw = categoryMatch?.[1]?.toUpperCase()
	const taggedCategory: ExpenseCategory | undefined =
		taggedCategoryRaw === 'SALARY' ? 'SALARY' : taggedCategoryRaw === 'OTHER' ? 'OTHER' : undefined
	const salaryUserId = userMatch?.[1] ? Number(userMatch[1]) : null

	const cleanComment = source
		.replace(CATEGORY_TAG, '')
		.replace(USER_TAG, '')
		.trim()

	// If explicit tag exists, it has priority.
	let category: ExpenseCategory = taggedCategory || 'OTHER'
	if (!taggedCategory && cleanComment) {
		const text = cleanComment.toLowerCase()
		const isSalary = /(зарплат|salary|зп|виплат)/i.test(text)
		const isRent = /(оренд|rent|комунал|utility|utilities)/i.test(text)

		if (isSalary) category = 'SALARY'
		else if (isRent) category = 'OTHER'
	}

	return {
		category,
		salaryUserId,
		cleanComment
	}
}
