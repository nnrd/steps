const {StepperFactory} = require('../index');

const stepper = StepperFactory.create({
    debug:true,
    hooks: {
        // async aroundExec(fn, name, data) {
        //     console.log('AROUND', name, data);
        //     const result = await fn();
        //     console.log('AFTER AROUND', name, result);
        //     return result;
        // },
        async aroundStep(fn, name, data) {
            console.log('AROUND STEP', name, data);
            const result = await fn();
            console.log('AFTER AROUND STEP', name, result);
            return result;
        },
    }
});
const steps = stepper.make('JOB');

async function main() {
    steps.add('Root', async (z, s) => {

        s.add('Step 1', async (n, s) => {
            s.add('One', async (x) => {
                return x + 2;
            });
            s.add('Two', async (x) => {
                //            throw Error('BUMMER');
                return x + 3;
            });
            s.add('Three', async (x) => {
                return x + 4;
            });

            return await s.chain(n) + 10;
        });

        s.add('Step 2', async (n) => {
            return n/2;
        });

        s.add('Step 3', async (n) => {
            return n*n;
        });

        return await s.chain(z);
    });

    const result = await steps.chain(42);
    return result;
}



(async () => {
    const result = await main();
    console.log(result);
})();
