class MyPromise {
    static STATE = {
        PENDING: "pending",
        FULFILLED: "fulfilled",
        REJECTED: "rejected",
    };

    constructor(executor) {
        this.state = MyPromise.STATE.PENDING;
        this.value = null;
        this.error = null;
        this.fulfilledCallbacks = [];
        this.rejectedCallbacks = [];

        const resolve = (value) => {
            if (this.state === MyPromise.STATE.PENDING){
                this.state = MyPromise.STATE.FULFILLED;
                this.value = value;
                this.fulfilledCallbacks.forEach(callback => callback(this.value));
            }
        };
        const reject = (error) => {
            if (this.state === MyPromise.STATE.PENDING){
                this.state = MyPromise.STATE.REJECTED;
                this.error = error;
                this.rejectedCallbacks.forEach(callback => callback(this.error));
            }
        };

        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    }

    then(callback) {
        return new MyPromise((resolve, reject) => {
            const handleCallback = (value) => {
                setTimeout(() => {
                    try {
                        const result = callback(value);
                        if (result instanceof MyPromise) {
                            result.then(resolve, reject);
                        } else {
                            resolve(result);
                        }
                    } catch (error) {
                        reject(error);
                    }
                }, 0);
            };
    
            if (this.state === MyPromise.STATE.FULFILLED) {
                handleCallback(this.value);
            }
            else {
                this.fulfilledCallbacks.push(handleCallback);
            }
        });
    }
    catch(onRejected) {
        return new MyPromise((resolve, reject) => {
            const handleCallback = (value) => {
                setTimeout(() => {
                    try {
                        const result = onRejected(value);
                        if (result instanceof MyPromise) {
                            result.then(resolve, reject);
                        } else {
                            resolve(result);
                        }
                    } catch (error) {
                        reject(error);
                    }
                }, 0);
            };
    
            if (this.state === MyPromise.STATE.REJECTED) {
                handleCallback(this.error);
            }
            else {
                this.rejectedCallbacks.push(handleCallback);
            }
        });
    }
    finally(callback) {
        return new MyPromise((resolve, reject) => {
            const handleCallback = () => {
                setTimeout(() => {
                    try {
                        callback();
                        if (this.state === MyPromise.STATE.FULFILLED) {
                            resolve(this.value);
                        } else {
                            reject(this.error);
                        }
                    } catch (error) {
                        reject(error);
                    }
                }, 0);
            };
    
            if (this.state !== MyPromise.STATE.PENDING) {
                handleCallback();
            } else {
                this.fulfilledCallbacks.push(handleCallback);
                this.rejectedCallbacks.push(handleCallback); 
            }
        });
    }
}