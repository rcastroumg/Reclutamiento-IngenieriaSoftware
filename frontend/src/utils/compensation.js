const currencySymbols = {
  GTQ: 'Q',
  USD: '$',
}

const frequencyLabels = {
  monthly: '/ mes',
  annual: '/ año',
}

function formatAmount(amount) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)
}

export function formatSalaryRange(position) {
  if (!position || position.salary_min <= 0 || position.salary_max <= 0 || position.salary_max < position.salary_min) {
    return 'Salario por definir'
  }

  const symbol = currencySymbols[position.salary_currency] ?? position.salary_currency
  const frequency = frequencyLabels[position.salary_frequency] ?? ''

  return `${symbol} ${formatAmount(position.salary_min)} - ${symbol} ${formatAmount(position.salary_max)} ${frequency}`
}
