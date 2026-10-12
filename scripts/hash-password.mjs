#!/usr/bin/env node
// Génère le hash bcrypt d'un mot de passe pour data/auth/access-rules.json.
// Usage : npm run hash-password -- 'mot de passe'
import bcrypt from 'bcrypt';

const password = process.argv[2];
if (!password) {
  console.error("Usage : npm run hash-password -- 'mot de passe'");
  process.exit(1);
}
console.log(bcrypt.hashSync(password, 10));
