
function memoize(fn) {
    const cache = new Map();

    function memoized(arg) {
        if (cache.has(arg)) {
            return cache.get(arg);
        } else {
            const result = fn(arg);
            cache.set(arg, result);
            return result;
        }
    };
    memoized.cache = cache;
    return memoized;
}

const foo = { a: 1, b: 2 };
const func = memoize((value) => Object.values(value));
console.log(func(foo)); // [1, 2]
foo.a = 2;
console.log(func(foo)); // [1, 2]
func.cache.delete(foo);
console.log(func(foo)); // [2, 2]