import { describe, test, expect } from "@jest/globals";
import MyPromise from "../3.promise.js"; 

describe('MyPromise 테스트', () => {

    describe('Promise.resolve', () => {
      test('Promise 객체가 resolve되어야 함', () => {
        const promise = new MyPromise((resolve) => {
          setTimeout(() => {
            resolve('성공');
          }, 50);
        });

        return promise.then((value) => {
          expect(value).toBe('성공');
          expect(promise.state).toBe(MyPromise.STATE.FULFILLED);
        });
      });
    });

    describe('Promise.reject', () => {
        test('Promise 객체가 reject되어야 함', () => {
            return new Promise((resolve) => {
              const error = new Error('실패');
              const promise = new MyPromise((_, reject) => {
                setTimeout(() => {
                  reject(error);
                }, 50);
              });
          
              promise.catch((err) => {
                expect(err).toBe(error);
                resolve();
              });
            });
        });
    });

    // Promise.then 테스트
    describe('Promise.then', () => {
      test('then에서 반환한 값이 다음 then으로 전달되어야 함', () => {
        const promise = new MyPromise((resolve) => {
          resolve(1);
        });

        return promise
          .then((value) => value + 1)
          .then((value) => {
            expect(value).toBe(2);
          });
      });
    });

    // Promise.catch 테스트
    describe('Promise.catch', () => {
      test('rejected Promise는 catch로 에러가 전달되어야 함', () => {
        const error = new Error('에러 발생');
        const promise = new MyPromise((_, reject) => {
          reject(error);
        });

        return promise.catch((err) => {
          expect(err).toBe(error);
        });
      });

      test('catch 이후 then으로 계속 체이닝 가능해야 함', () => {
        const promise = new MyPromise((_, reject) => {
          reject('에러');
        });

        return promise
          .catch(() => '에러 복구')
          .then((value) => {
            expect(value).toBe('에러 복구');
          });
      });
    });

    // Promise.finally 테스트
    describe('Promise.finally', () => {
      test('resolve된 Promise에서 finally가 호출되어야 함', () => {
        let finallyCalled = false;
        
        const promise = new MyPromise((resolve) => {
          resolve('성공');
        });

        return promise
          .finally(() => {
            finallyCalled = true;
          })
          .then((value) => {
            expect(finallyCalled).toBe(true);
            expect(value).toBe('성공');
          });
      });

      test('rejected Promise에서 finally가 호출되어야 함', () => {
        let finallyCalled = false;
        const error = new Error('실패');

        return new MyPromise((_, reject) => {
          reject(error);
        })
          .finally(() => {
            finallyCalled = true;
          })
          .catch((err) => {
            expect(finallyCalled).toBe(true);
            expect(err).toBe(error);
          });
      });
    });
});
