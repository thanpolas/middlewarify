/**
 * @fileoverview Concurrent execution option.
 */
const { assert } = require('chai');

const midd = require('..');

suite.only('concurrent execution', function () {
  test('Should run all concurrently', async function () {
    function assertExecution() {}
    const obj = {};
    midd.make(obj, 'run', assertExecution, { concurrent: true, async: true });

    function wait(ms) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    }

    obj.run.use(wait.bind(null, 100));
    obj.run.use(wait.bind(null, 100));
    obj.run.use(wait.bind(null, 100));
    obj.run.use(wait.bind(null, 100));

    const beforeRunDt = new Date();

    await obj.run();

    const nowDt = new Date();

    const dtDiff = nowDt - beforeRunDt;

    assert.isAbove(dtDiff, 100, 'Exec time should be above 100ms');
    assert.isBelow(dtDiff, 150, 'Exec time should not be higher than 150ms');
  });
  test('All concurrent middleware should receive same arguments', async function () {
    function assertExecution() {}
    const obj = {};
    midd.make(obj, 'run', assertExecution, { concurrent: true, async: true });

    function wait(ms, arg1, arg2) {
      assert.equal(arg1, 1, 'First argument should be value: 1');
      assert.equal(arg2, 2, 'Second argument should be value: 2');
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    }

    obj.run.use(wait.bind(null, 100));
    obj.run.use(wait.bind(null, 100));
    obj.run.use(wait.bind(null, 100));
    obj.run.use(wait.bind(null, 100));

    const beforeRunDt = new Date();

    await obj.run(1, 2);

    const nowDt = new Date();

    const dtDiff = nowDt - beforeRunDt;

    assert.isAbove(dtDiff, 100, 'Exec time should be above 100ms');
    assert.isBelow(dtDiff, 150, 'Exec time should not be higher than 150ms');
  });

  test('One failed concurrent middleware will not stop others from executing', async function () {
    function assertExecution(res) {
      assert.isArray(res);
      assert.lengthOf(res, 4);
      const [midd1, midd2, midd3, midd4] = res;
      assert.equal(midd1.status, 'fulfilled');
      assert.equal(midd1.value, 1);
      assert.equal(midd2.status, 'fulfilled');
      assert.equal(midd2.value, 2);
      assert.equal(midd3.status, 'fulfilled');
      assert.equal(midd3.value, 3);
      assert.equal(midd4.status, 'rejected');
      assert.equal(midd4.reason, 'Error: not gonna happen');
    }

    const obj = {};
    midd.make(obj, 'run', assertExecution, { concurrent: true, async: true });

    let finished1 = false;
    let finished2 = false;
    let finished3 = false;

    obj.run.use(async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          finished1 = true;
          resolve(1);
        }, 100);
      });
    });

    obj.run.use(async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          finished2 = true;
          resolve(2);
        });
      }, 100);
    });

    obj.run.use(async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          finished3 = true;
          resolve(3);
        });
      }, 100);
    });

    obj.run.use(async () => {
      throw new Error('not gonna happen');
    });

    const beforeRunDt = new Date();

    await obj.run();

    const nowDt = new Date();

    const dtDiff = nowDt - beforeRunDt;

    assert.isAbove(dtDiff, 100, 'Exec time should be above 100ms');
    assert.isBelow(dtDiff, 150, 'Exec time should not be higher than 150ms');
    assert.isTrue(finished1);
    assert.isTrue(finished2);
    assert.isTrue(finished3);
  });

  test('mainCallback and return value will one and the same', async function () {
    function assertExecution(res) {
      assert.isArray(res);
      assert.lengthOf(res, 3);
      const [midd1, midd2, midd3] = res;
      assert.equal(midd1.status, 'fulfilled');
      assert.equal(midd1.value, 1);
      assert.equal(midd2.status, 'fulfilled');
      assert.equal(midd2.value, 2);
      assert.equal(midd3.status, 'fulfilled');
      assert.equal(midd3.value, 3);
    }

    const obj = {};
    midd.make(obj, 'run', assertExecution, { concurrent: true, async: true });

    obj.run.use(async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(1);
        }, 100);
      });
    });

    obj.run.use(async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(2);
        }, 100);
      });
    });

    obj.run.use(async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(3);
        }, 100);
      });
    });

    const beforeRunDt = new Date();

    const res = await obj.run();

    const nowDt = new Date();

    const dtDiff = nowDt - beforeRunDt;

    assert.isAbove(dtDiff, 100, 'Exec time should be above 100ms');
    assert.isBelow(dtDiff, 150, 'Exec time should not be higher than 150ms');

    assertExecution(res);
  });

  test('Should not accept concurrent option without async', async function () {
    function assertExecution() {}
    const obj = {};

    assert.throws(() => {
      midd.make(obj, 'run', assertExecution, { concurrent: true });
    });
  });

  test('Should not accept concurrent option with beforeAfter', async function () {
    function assertExecution() {}
    const obj = {};

    assert.throws(() => {
      midd.make(obj, 'run', assertExecution, {
        concurrent: true,
        async: true,
        beforeAfter: true,
      });
    });
  });
});
