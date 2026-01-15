export default class MyPromise {
    static STATE = {
        PENDING: "pending",
        FULFILLED: "fulfilled",
        REJECTED: "rejected",
    };

    constructor(executor) {
        this.state = MyPromise.STATE.PENDING;  // Promise 상태
        this.result = undefined;               // Promise 결과값
        this.fulfillReactions = [];          // 성공 시 실행할 핸들러 배열
        this.rejectReactions = [];           // 실패 시 실행할 핸들러 배열
        this.isHandled = false;                // Promise가 처리되었는지 여부

        const resolve = (value) => {
            if (this.state !== MyPromise.STATE.PENDING) return;

            this.state = MyPromise.STATE.FULFILLED;
            this.result = value;
            this.fulfillReactions.forEach(handler => {
                queueMicrotask(() => handler(this.result));
            });
            this.fulfillReactions = [];
        };

        const reject = (error) => {
            if (this.state !== MyPromise.STATE.PENDING) return;

            this.state = MyPromise.STATE.REJECTED;
            this.result = error;
            this.rejectReactions.forEach(handler => {
                queueMicrotask(() => handler(this.result));
            });
            this.rejectReactions = [];
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
                queueMicrotask(() => {
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
                    this.isHandled=true;
                });
            };
    
            if (this.state === MyPromise.STATE.FULFILLED) {
                handleCallback(this.result);
            }
            else {
                this.fulfillReactions.push(handleCallback);
            }
        });
    }
    catch(onRejected) {
        return new MyPromise((resolve, reject) => {
            const handleCallback = (value) => {
                queueMicrotask(() => {
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
                });
            };
    
            if (this.state === MyPromise.STATE.REJECTED) {
                handleCallback(this.result);
            }
            else {
                this.rejectReactions.push(handleCallback);
            }
        });
    }
    finally(callback) {
        return new MyPromise((resolve, reject) => {
            const handleCallback = () => {
                queueMicrotask(() => {
                    try {
                        callback();
                        if (this.state === MyPromise.STATE.FULFILLED) {
                            resolve(this.result);
                        } else {
                            reject(this.result);
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            };
    
            if (this.state !== MyPromise.STATE.PENDING) {
                handleCallback();
            } else {
                this.fulfillReactions.push(handleCallback);
                this.rejectReactions.push(handleCallback); 
            }
        });
    }
}