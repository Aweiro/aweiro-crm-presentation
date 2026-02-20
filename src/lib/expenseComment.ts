export function normalizeExpenseComment(raw?: string | null) {
	const text = (raw || '').trim()
	if (!text) return ''

	// Collapse accidental duplicated salary prefixes in legacy comments.
	const collapsed = text.replace(
		/^(\s*Зарплата\s*\(userId:\d+\):\s*){2,}/i,
		(match) => {
			const one = match.match(/Зарплата\s*\(userId:\d+\):\s*/i)
			return one?.[0] || match
		}
	)

	const hadTechnicalSalaryPrefix = /^Зарплата\s*\(userId:\d+\):\s*/i.test(
		collapsed
	)

	// Hide technical userId marker in UI text.
	const withoutTechnicalPrefix = collapsed.replace(
		/^Зарплата\s*\(userId:\d+\):\s*/i,
		''
	)

	if (
		hadTechnicalSalaryPrefix &&
		withoutTechnicalPrefix &&
		!/^Зарплата\s*:/i.test(withoutTechnicalPrefix)
	) {
		return `Зарплата: ${withoutTechnicalPrefix}`
	}

	return withoutTechnicalPrefix || collapsed
}
