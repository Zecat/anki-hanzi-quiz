import { getDecomposition, CharDataItem, ComponentDefinition } from "./HanziDesc";

test("大 Decomposition ", () => {
    const item: CharDataItem = {
        character: "㐌",
        definition: "",
        pinyin: ["yí"],
        decomposition: "⿱亻也",
        etymology: {
            type: "",
            semantic: "",
            hint: "",
        },
        radical: "",
        matches: [[0], [0], [1], [1], [1]],
    };
    const def: ComponentDefinition = getDecomposition(item);
    console.log(def);
});
// Write your test cases using the test function provided by Jest
test("Decomposition", () => {
    const item: CharDataItem = {
        character: "㐌",
        definition: "",
        pinyin: ["yí"],
        decomposition: "⿱亻也",
        etymology: {
            type: "",
            semantic: "",
            hint: "",
        },
        radical: "",
        matches: [[0], [0], [1], [1], [1]],
    };
    const def: ComponentDefinition = getDecomposition(item);
    console.log(def);
});
test("Decomposition2", () => {
    const item: CharDataItem = {
        character: "㒼",
        definition: "",
        pinyin: ["yí"],
        decomposition: "⿱廿⿻巾⿰入入",
        etymology: {
            type: "",
            semantic: "",
            hint: "",
        },
        radical: "",
        matches: [[0],[0],[0],[0],[1,0],[1,0],[1,0],[1,1,0],[1,1,0],[1,1,1],[1,1,1]],
    };
    const def: ComponentDefinition = getDecomposition(item);
    console.log(def);
    console.log(def.components[1].components)
    console.log(def.components[1].components[1])
});
