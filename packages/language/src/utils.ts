export function assertTrue(condition: boolean): asserts condition {
    if(!condition) {
        throw new Error('Condition is supposed to be true!');
    }
}