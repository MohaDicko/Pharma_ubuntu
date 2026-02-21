import NextAuth from 'next-auth';
import { authConfig } from '../auth.config';

const auth = NextAuth(authConfig).auth;
export default auth;
export { auth as proxy };

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};

