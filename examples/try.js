const {StepperFactory} = require('../index');

const stepper = StepperFactory.create({debug:true});
const steps = stepper.make();

async function main() {
    steps.add('Step 1', async (n, s) => {

        s.add('One', async (x) => {
            return x + 2;
        });

        s.add('Two', async (x) => {
            return x + 3;
        });

        s.add('Three', async (x) => {
            return x + 4;
        });

        return await s.chain(n) + 10;
    });

    steps.add('Step 2', async (n) => {
        return n/2;
    });

    steps.add('Step 3', async (n) => {
        return n*n;
    });

    const result = await steps.batch(42);
    return result;
}


(async () => {
    const result = await main();
    console.log(result);
})();
