# Lettre — Teliae
**À:** Nicolas Labille (Directeur Commercial) — commerce@teliae.fr
**CC:** support.teliae.fr
**Objet:** Demande de documentation technique et accès sandbox — Intégration Shiptify × Teliae

---

Monsieur Labille,

Je me permets de vous contacter au nom de **Shiptify**, plateforme TMS (Transport Management System) française avec laquelle votre solution Teliae est actuellement intégrée en production.

Je suis **Aleh Asmalouski**, ingénieur logiciel chez Shiptify, responsable de l'intégration avec Teliae. Nous utilisons votre API pour transmettre les données d'expédition et récupérons les mises à jour de suivi via votre serveur FTP.

---

## Contexte de notre intégration

Notre intégration actuelle repose sur :
- Votre API pour l'envoi des données d'expédition
- La récupération des étiquettes (ZPL/PDF) et documents de livraison (POD)
- Le suivi FTP avec les dictionnaires de statuts Inovert/TNT
- La gestion des matières dangereuses (lignes MD, conformité ADR)

---

## Problèmes rencontrés et besoins

Malgré cette intégration opérationnelle, **notre équipe manque de documentation officielle**, ce qui génère des difficultés lors de mises à jour, de l'onboarding de nouveaux clients, et du débogage. Voici nos besoins précis :

### 1. Documentation complète de l'API

Nous ne disposons pas de spécification formelle de votre API. Nous avons besoin :

- La liste exhaustive de **tous les types de lignes** supportés (BL, UM, MD — et tout autre type disponible)
- Pour chaque ligne : **tous les champs disponibles** (obligatoires et optionnels), leur taille maximale, leur format et leurs valeurs acceptées
- Pour les lignes MD (matières dangereuses) : spécification complète des champs ADR (notamment champs 17–24 : Quantité exceptée, Déchet, Retour emballage vide, Dangereux pour l'environnement, Dispositions spéciales, Informations techniques, Chargement Automatique)
- La liste des **codes transporteurs** et **codes produits** disponibles par environnement
- Le format de réponse JSON complet avec tous les codes d'erreur possibles et leur signification

### 2. Environnement de test / sandbox

Actuellement, notre équipe ne dispose d'**aucun environnement de test ou sandbox** côté Teliae. Toute modification doit être validée directement en production, ce qui est risqué.

Nous demandons :
- L'accès à un **environnement de recette/sandbox** fonctionnel
- Des credentials de test (compte, FTP)
- Des instructions de configuration pour cet environnement

### 3. Documentation du suivi FTP

- Format complet des fichiers CSV de suivi envoyés via FTP
- **Liste exhaustive des codes statuts** et leur signification (pour les dictionnaires Inovert et TNT)
- Fréquence de mise à jour des fichiers
- Documentation du processus POD : paramètres, format de réponse, gestion des erreurs

### 4. Versionnage et évolutions prévues

- Y a-t-il un **plan de migration** vers une API REST moderne ?
- Quelle est la politique de rétrocompatibilité de l'API actuelle ?
- Comment êtes-vous informés des breaking changes ?

---

## Ce que nous proposons

Nous sommes prêts à collaborer étroitement avec vos équipes techniques. Nous pouvons :
- Participer à des sessions de travail technique (visioconférence)
- Remonter les bugs ou incohérences que nous avons identifiés

---

Je reste disponible pour tout échange technique et vous remercie par avance de l'attention portée à cette demande.

Dans l'attente de votre retour,

Bien cordialement,

**Aleh Asmalouski**
Ingénieur Logiciel — Intégrations
Shiptify
aleh.asmalouski@shiptify.com

