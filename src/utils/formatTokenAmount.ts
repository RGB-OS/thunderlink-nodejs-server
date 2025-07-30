export const formatTokenAmount = (amount: number, precision: number = 6): string => {
    return (amount / 10 ** precision).toFixed(precision); // always shows e.g. 50.000000
  };