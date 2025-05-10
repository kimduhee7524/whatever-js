function cloneDeep(target) {
    if (typeof target !== 'object' || target === null) {
        return target;
    }

    if (Array.isArray(target)) {
        return target.map((item) => cloneDeep(item));
    }
    const result = {}
    for (let key in target) {
        result[key] = cloneDeep(target[key]);
    }

    return result;
}

const obj = { a: 1, b: { c: 2, d: 3 } };
const clonedObj = cloneDeep(obj);
console.log(clonedObj); // { a: 1, b: { c: 2, d: 3 } }
console.log(obj === clonedObj); // false
console.log(obj.b === clonedObj.b); // false
obj.b.c = 4;
console.log(obj); // { a: 1, b: { c: 4, d: 3 } }
console.log(clonedObj); // { a: 1, b: { c: 2, d: 3 } }