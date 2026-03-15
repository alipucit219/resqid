export interface GenericAccumulator {
  [key: string]: any;
}

const PUBLIC_DOMAINS = 'gmail|hotmail|yahoo|aol|icloud'
  .split('|')
  .reduce((acc: GenericAccumulator, name) => {
    acc[name] = true;
    return acc;
  }, {});

export const isPublicEmail = (email: string) => {
  const domain = (email.match(/@(\w+)/) || [])[1];

  if (!domain) {
    return false;
  }

  return PUBLIC_DOMAINS[domain] || false;
};