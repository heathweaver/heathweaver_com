export function formatDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate) return '';
  
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };
  
  if (!end) {
    return `${formatDate(start)} - Present`;
  }
  
  return `${formatDate(start)} - ${formatDate(end)}`;
} 