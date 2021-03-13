const flattenDeep = (array: any[]) => {
  let flattened: any[] = [];

  for (const item of array) {
    if (Array.isArray(item)) {
      flattened = [...flattened, ...item];
      flattened = [...flattenDeep(flattened)]
    } else {
      flattened.push(item);
    }
  }

  return flattened;
}

export default flattenDeep;
