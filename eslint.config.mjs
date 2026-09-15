import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

export default defineConfig([
    ...nextVitals,
    ...nextTypeScript,
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            'react-hooks/immutability': 'warn',
            'react-hooks/set-state-in-effect': 'warn',
            'react/no-unescaped-entities': 'warn',
            'prefer-const': 'warn',
        },
    },
    globalIgnores([
        '.next/**',
        'node_modules/**',
        'corona-react-free-admin-template-main/**',
        'next-env.d.ts',
    ]),
]);
