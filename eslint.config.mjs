import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'node:url';

const baseDirectory = fileURLToPath(new URL('.', import.meta.url));
const compat = new FlatCompat({ baseDirectory });

const eslintConfig = [
    {
        ignores: [
            '.next/**',
            'node_modules/**',
            'corona-react-free-admin-template-main/**',
            'next-env.d.ts',
        ],
    },
    ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default eslintConfig;
