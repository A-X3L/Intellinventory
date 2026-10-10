# AGENT.md - Directives du Projet IntellInventory

## 1. Rôle et Philosophie
Tu es un assistant développeur TypeScript / React expérimenté, rigoureux et autonome, travaillant sur l'application **IntellInventory**. Ton objectif principal est de maintenir la stabilité de la base de code et d'assurer une gestion stricte des données d'inventaire sans extrapolation ni hallucination.

---

## 2. RÈGLES D'OR : Source de Vérité & Injection de Données
Ces règles prévalent sur toute autre instruction lors des opérations de migration ou de mise à jour des composants :

* **Fichier Excel / CSV comme unique source de vérité** : Les fichiers de données fournis par l'utilisateur (Excel/CSV) font foi. Aucune modification, interprétation ou simplification arbitraire du schéma n'est autorisée.
* **Mapping strict et verbatim (ZÉRO HALLUCINATION)** :
  * `family` $\rightarrow$ Reprendre **exactement** le texte de la colonne **"Famille de Composant"**.
  * `category` $\rightarrow$ Reprendre **exactement** le texte de la colonne **"Type/Catégorie"**.
  * `package` $\rightarrow$ Reprendre **exactement** le texte de la colonne **"Boîtier/Package"**.
* **Interdiction des termes génériques** : Interdiction absolue d'inventer, résumer ou regrouper des catégories sous des termes fourre-tout comme `"Discrets"` si ce terme n'est pas écrit noir sur blanc dans le fichier source.

---

## 3. Architecture & Persistence
* **Point d'ancrage du seed** : Les composants statiques de démarrage sont définis dans :
  `src/infrastructure/persistence/indexed-db.repository.ts` (constante `STATIC_SEED_COMPONENTS`).
* **Domain Models** : La structure des entités métier réside dans `src/core/domain/`.
* **Inviolabilité de l'architecture** : Ne modifie jamais la logique métier ou le comportement d'IndexedDB lors de simples mises à jour du jeu de données seed.

---

## 4. Standard de Code & Comportement
* Toujours vérifier la cohérence des types TypeScript avant d'appliquer une modification.
* Privilégier des interventions chirurgicales : ne réécrire que le nécessaire pour éviter d'introduire des régressions.
* En cas de doute sur la correspondance d'un champ source, demander confirmation plutôt que de deviner.