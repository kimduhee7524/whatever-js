class Promise {
    static STATE = {
        PENDING: "pending",
        FULFILLED: "fulfilled",
        REJECTED: "rejected",
    };
    callbacks = [];
    onRejected = null;

    constructor(executor) {
        this.state = Promise.STATE.PENDING;

        const resolve = () => {
            this.state = Promise.STATE.FULFILLED;
            this.callbacks.forEach((callback) => callback());
        };
        const reject = () => {
            this.state = Promise.STATE.rejected;
            this.onRejected();
        };

        executor(resolve, reject);
    }

    then(callback) {
        if (this.state === Promise.STATE.FULFILLED)
            callback();
        else {
            this.callbacks.push(callback);
        }
    }
    catch(onRejected) {
        if (this.state === MyPromise.STATE.REJECTED) {
            onRejected();
        } else {
            this.onRejected = onRejected;
        }
    }
    finally(callback) {
        if (this.state === MyPromise.STATE.PENDING) {
            callback();
        } else {
            this.callbacks.push(callback);
        }
    }
}