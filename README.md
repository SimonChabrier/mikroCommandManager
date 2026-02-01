# MikroDoc

Application web de gestion de commandes terminal. Permet de stocker, rechercher et organiser des commandes Linux fréquemment utilisées.

## Stack technique

- Symfony 7.4.*
- Stimulus (AssetMapper)
- Tailwind CSS v4
- Doctrine ORM

## Installation

```bash
composer install
npm install
```

## Configuration

Copier le fichier `.env` en `.env.local` et configurer la connexion à la base de données :

```
DATABASE_URL="mysql://user:password@127.0.0.1:3306/mikrodoc"
```

Créer la base de données et exécuter les migrations :

```bash
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
```

## Lancement

```bash
symfony server:start
```

