import js from "@eslint/js";

export default [
    js.configs.recommended,

   {  
      files: ["**/*.js", "**/*.jsx"],
       rules: {
           "complexity": ["warn", { "max": 15 }]
       },
       "ignores": ["frontend/src/assets/**"]
   }
];