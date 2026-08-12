# AutoDrive — portfolio kit

This file contains ready-to-use material for presenting AutoDrive on a CV, LinkedIn or during an interview.

## CV — version courte

**AutoDrive — Application full-stack de gestion automobile**  
Next.js · TypeScript · FastAPI · Python · PostgreSQL · Docker · GitHub Actions · Vercel · Render

- Conception et développement d'une application full-stack permettant de gérer véhicules, entretiens, dépenses, rappels et statistiques.
- Implémentation d'une authentification JWT avec hachage Argon2 et isolation des données par utilisateur.
- Mise en production d'une architecture Next.js / FastAPI / PostgreSQL avec migrations Alembic, CI GitHub Actions et déploiement Vercel + Render.

## CV — version orientée ingénierie logicielle

**Projet personnel — AutoDrive**

- Architecture d'un monorepo Next.js 16 / FastAPI / PostgreSQL avec API REST documentée via OpenAPI.
- Développement des CRUD métier et d'un dashboard agrégé par utilisateur, catégorie et mois.
- Sécurisation des accès par JWT, contrôle de propriété côté API, gestion des secrets par variables d'environnement et CORS configurable.
- Industrialisation avec Docker Compose, Alembic, tests d'intégration et pipeline CI séparant validations backend et frontend.
- Déploiement public : frontend sur Vercel, API et PostgreSQL sur Render.

## Description LinkedIn

🚗 **AutoDrive — projet full-stack déployé**

J'ai conçu et mis en ligne AutoDrive, une application de gestion automobile permettant à chaque utilisateur de centraliser ses véhicules, entretiens, dépenses et rappels, avec un dashboard de suivi des coûts.

Le projet m'a permis de travailler toute la chaîne d'une application web : interface Next.js/TypeScript, API FastAPI, PostgreSQL/SQLAlchemy, authentification JWT, migrations Alembic, Docker, tests d'intégration, CI GitHub Actions et déploiement sur Vercel + Render.

Une attention particulière a été portée à l'isolation des données entre utilisateurs, à la reproductibilité des migrations et à la séparation de la configuration sensible via les variables d'environnement.

**Démo :** https://autodrive-lilac.vercel.app  
**API / Swagger :** https://autodrive-api-idsz.onrender.com/docs  
**Code :** https://github.com/syrine291100/Autodrive

## Pitch entretien — 30 secondes

AutoDrive est une application full-stack de gestion automobile que j'ai construite de bout en bout. Le frontend est en Next.js et TypeScript, l'API en FastAPI, et les données sont stockées dans PostgreSQL. J'ai développé l'authentification JWT, l'isolation des données par utilisateur, les CRUD véhicules/entretiens/dépenses/rappels et un dashboard agrégé. J'ai ensuite industrialisé le projet avec Alembic, Docker et GitHub Actions avant de le déployer sur Vercel et Render.

## Pitch entretien — 2 minutes

L'objectif d'AutoDrive était de construire un projet full-stack qui ne soit pas seulement une démonstration locale, mais une application réellement déployable.

J'ai séparé le système en un frontend Next.js/TypeScript et une API FastAPI. PostgreSQL est utilisé partout — en local, en CI et en production — afin de limiter les différences de comportement entre environnements.

Côté métier, l'utilisateur peut créer un compte, se connecter, gérer plusieurs véhicules, enregistrer des entretiens et des dépenses, programmer des rappels par date ou kilométrage et suivre des indicateurs dans un dashboard. Toutes les requêtes sont isolées par utilisateur côté backend : connaître l'identifiant d'une ressource appartenant à quelqu'un d'autre ne permet pas d'y accéder.

Pour la partie engineering, j'ai mis en place des migrations Alembic reproductibles depuis une base vide, une configuration par variables d'environnement, Docker Compose pour PostgreSQL en local et une CI GitHub Actions. La CI reconstruit la base, applique les migrations, lance des tests d'intégration de l'API, puis vérifie aussi le lint et le build Next.js.

Enfin, j'ai déployé le frontend sur Vercel et le backend avec PostgreSQL sur Render. Le projet m'a surtout appris à traiter une application comme un système complet : code, sécurité, base de données, configuration, tests et déploiement.

## Questions techniques possibles

### Pourquoi FastAPI ?

FastAPI fournit une validation de schémas claire avec Pydantic, l'injection de dépendances utile pour la session DB et l'utilisateur courant, ainsi qu'une documentation OpenAPI automatique. Pour ce projet, cela permet de garder une API typée et facile à tester.

### Pourquoi PostgreSQL aussi en local ?

Utiliser PostgreSQL en développement, CI et production réduit les écarts entre environnements. Docker Compose rend le démarrage local reproductible sans installer manuellement le serveur PostgreSQL.

### Pourquoi Alembic plutôt que `create_all()` ?

`create_all()` crée l'état courant des modèles mais ne représente pas l'historique du schéma. Alembic permet de versionner les changements, de reconstruire la base depuis zéro et d'appliquer les mêmes migrations en CI et en production.

### Comment l'isolation entre utilisateurs est-elle assurée ?

Chaque véhicule possède un `user_id`. Les lectures et mutations de véhicules filtrent par l'utilisateur authentifié. Pour les entretiens, dépenses et rappels, les requêtes rejoignent le véhicule propriétaire avant d'autoriser une modification ou suppression.

### Comment fonctionne l'authentification ?

Le mot de passe est haché avec Argon2. Le login renvoie un JWT signé. Le frontend envoie ensuite ce token dans l'en-tête `Authorization: Bearer ...` pour les routes protégées.

### Quelle amélioration sécurité ferais-tu ensuite ?

Je déplacerais la persistance de session du `localStorage` vers des cookies sécurisés `HttpOnly`/`SameSite`, puis j'ajouterais du rate limiting sur les routes d'authentification et une stratégie de rotation/expiration plus complète.

### Comment vérifies-tu qu'une migration est fiable ?

La CI démarre une base PostgreSQL vide, exécute `alembic upgrade head`, puis `alembic check`. Cela vérifie à la fois que l'historique peut construire le schéma et que les métadonnées SQLAlchemy ne contiennent pas de changement oublié.

### Pourquoi Vercel et Render ?

Vercel correspond bien au frontend Next.js, tandis que Render permet d'héberger l'API Python et PostgreSQL. La séparation reflète l'architecture du projet tout en gardant le déploiement simple pour un portfolio.

## Points à montrer pendant une démo

1. Créer un compte et se connecter.
2. Ajouter un véhicule.
3. Ajouter un entretien et une dépense.
4. Créer un rappel au kilométrage.
5. Montrer le dashboard qui se met à jour.
6. Se déconnecter puis se reconnecter pour montrer la persistance.
7. Ouvrir Swagger pour montrer l'API.
8. Montrer la CI GitHub Actions et l'historique de pull requests.

## Points forts à mettre en avant

- projet réellement déployé, pas uniquement exécuté en local ;
- architecture frontend/backend/base de données complète ;
- sécurité et isolation multi-utilisateur prises en compte ;
- migrations reproductibles ;
- workflow Git par branches et pull requests ;
- automatisation CI ;
- documentation technique et API consultable publiquement.
