# ArtisanBF — Inventaire des fonctionnalités

> Annuaire géolocalisé connectant les artisans locaux du Burkina Faso aux clients, avec des outils IA (analyse d'avis, résumé, recherche vocale) et une expérience installable/hors-ligne (PWA).

---

## 1. Positionnement

- **Cible** : particuliers cherchant un artisan de confiance (mécanicien, couturier, coiffeur, soudeur, menuisier, électricien, plombier, réparateur téléphone, peintre, fleuriste...) et artisans souhaitant être visibles et gérer leur activité en ligne.
- **3 profils utilisateurs** : Citoyen (client), Artisan (professionnel), Administrateur (modération de la plateforme).
- **Différenciateurs** : IA appliquée aux avis (sentiment, pertinence, note, résumé), recherche et dictée vocales, mode urgence géolocalisé, application installable fonctionnant hors connexion.

---

## 2. Annuaire public (grand public, sans compte)

- **Page d'accueil** : recherche rapide, artisans à proximité, catégories en vedette, artisans les mieux notés, statistiques de la plateforme (nombre d'artisans, villes couvertes, note moyenne).
- **Annuaire / recherche** :
  - Recherche texte libre (nom, métier, ville, adresse)
  - Filtres : catégorie (pastilles avec icônes par métier), ville, note minimum
  - Recherche vocale (dictée → intention détectée par IA : recherche / avis / urgence)
  - Vue liste (grille de cartes) ou **vue carte interactive** (Leaflet/OpenStreetMap)
  - Pagination, réinitialisation rapide des filtres
- **Fiche commerce** :
  - Galerie photo, description, catégorie, adresse, téléphone
  - Actions rapides : Appeler, WhatsApp, ajout aux favoris
  - Carte de localisation
  - Avis clients avec note, **badge de sentiment IA** (positif/neutre/négatif) et **note IA** calculée automatiquement
  - **Résumé IA automatique des avis** (points forts / points faibles) dès qu'il y a suffisamment de commentaires
  - Formulaire d'avis avec dictée vocale, publication anonyme possible
  - Commerces similaires suggérés
  - Compteurs de vues/appels/clics WhatsApp (statistiques par commerce)
- **Mode urgence** (`/urgence`) : géolocalisation immédiate, tri des artisans par distance réelle, filtre par métier, actions Appeler/WhatsApp en un tap — pensé pour un besoin pressant (panne, réparation urgente).
- **Favoris** : sauvegarde locale des artisans préférés, consultable sans compte.
- **Devenir artisan** : un citoyen peut activer un espace artisan depuis son profil pour publier ses propres commerces.

---

## 3. Intelligence artificielle (Groq — Llama 3.1 + Whisper)

| Fonctionnalité | Déclencheur | Résultat |
|---|---|---|
| **Analyse d'avis** | À la création d'un avis | Pertinence, sentiment, note /5, points forts/faibles, détection spam |
| **Résumé d'avis** | ≥ 2 avis exploitables sur une fiche | Synthèse courte + points forts/faibles agrégés |
| **Recherche vocale** | Dictée sur l'annuaire/l'accueil | Intention (recherche/avis/urgence), catégorie, quartier, urgence détectée |
| **Dictée d'avis (speech-to-text)** | Bouton micro sur le formulaire d'avis | Transcription du texte de l'avis |
| **Réponse suggérée à un avis** | Vue artisan sur un avis reçu | Réponse professionnelle générée au nom de l'artisan |

---

## 4. Espace Citoyen (`/dashboard`)

- Tableau de bord personnel
- **Recherche** : version allégée de l'annuaire intégrée au dashboard
- **Mes favoris** : gestion des artisans sauvegardés
- **Mes avis** : historique des avis publiés, avec note IA, suppression
- **Mon profil** : informations personnelles, changement de mot de passe, activation de l'espace artisan, déconnexion

## 5. Espace Artisan (`/dashboard`, rôle artisan)

- **Mes commerces** : création/modification de fiches commerce (nom, description, catégorie, adresse, géolocalisation avec géocodage automatique, téléphone, photos uploadées)
- **Statistiques** : évolution des vues/appels/clics WhatsApp par période, commerce le plus performant, résumé des avis reçus
- Réponse aux avis clients assistée par IA

## 6. Espace Administrateur (`/admin`)

- **Tableau de bord** : total utilisateurs / commerces / commentaires / vues, activité récente, répartition par catégorie
- **Utilisateurs** : liste, modification, suppression
- **Commerces** : modération, activation/désactivation de la visibilité publique, suppression
- **Commentaires** : approbation, marquage spam, suppression, avec **badge note IA**
- **Catégories** : CRUD complet (création/édition/suppression via modale)
- **Signalements** : file de modération (en attente / résolu / rejeté) pour les avis ou commerces signalés

---

## 7. Comptes & sécurité

- Inscription / connexion (Supabase Auth), mot de passe oublié / réinitialisation
- Rôles : citoyen, artisan, administrateur — protection des routes par rôle
- Changement de mot de passe, gestion de session

---

## 8. Application installable & hors-ligne (PWA)

- **Installable** sur mobile/desktop (icône, mode standalone, raccourcis "J'ai une urgence" / "Annuaire") avec bouton d'installation intégré à l'interface
- **Cache hors-ligne des données** (commerces, catégories, avis) : navigation possible sans réseau sur les pages déjà visitées, avec indicateur visuel "données en cache"
- **File d'attente hors-ligne** : un avis rédigé sans connexion est conservé localement et publié automatiquement dès la reconnexion
- Page de repli hors-ligne dédiée, bannière de statut réseau

## 9. Mobile & performance

- Navigation mobile dédiée par espace (public / dashboard / admin) avec barre de navigation basse fixe
- Images optimisées automatiquement (AVIF/WebP, redimensionnement)
- Mise en cache longue durée des ressources statiques

---

## 10. Documentation technique

- Documentation API interactive (Swagger) sur `/api-docs`
- Architecture : frontend Next.js (interface) + backend Next.js dédié à l'API, base de données Supabase partagée
