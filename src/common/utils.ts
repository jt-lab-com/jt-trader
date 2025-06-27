export function getAllObjectMethods(toCheck: any): string[] {
  const props = [];
  let obj = toCheck;
  while (obj.constructor.name !== 'Object') {
    props.push(...Object.getOwnPropertyNames(obj));
    obj = Object.getPrototypeOf(obj);
  }

  return props.sort().filter((e, i, arr) => {
    if (e != arr[i + 1] && typeof toCheck[e] == 'function') return true;
  });
}
