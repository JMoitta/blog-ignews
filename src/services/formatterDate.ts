import { parseISO, format } from 'date-fns';

// import pt from 'date-fns/locales/pt';

export function formatterDatePublication(date: string): string {
  const firstDate = parseISO(date);

  const formattedDate = format(firstDate, 'dd MMM yyyy');
  return formattedDate.toLowerCase();
}
