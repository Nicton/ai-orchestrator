# Lettre — GTF / INOVERT (pour DHL Inovert)
**À:** Jean-Marc Ors (Président GTF) / Pierre Gérard (Délégué Général)
**Email:** inovert@gtff.org
**Téléphone:** +33 (0)6 701 78 600
**Adresse:** 1 Rue de Stockholm, 75008 Paris
**Objet:** Demande de spécification INOVERT (DISPOR / REPORT) et accès à la documentation technique — Shiptify

---

Monsieur Ors, Monsieur Gérard,

Je me permets de vous contacter au nom de **Shiptify**, plateforme TMS française, concernant notre intégration avec le réseau INOVERT via le format EDIFACT DISPOR/REPORT.

Je suis **Aleh Asmalouski**, ingénieur logiciel chez Shiptify, responsable de nos intégrations EDI. Dans le cadre de notre activité, nous échangeons des messages EDIFACT au format INOVERT avec plusieurs partenaires transporteurs, notamment via **DHL France** (que nous intégrons sous la dénomination interne "DHL Inovert") ainsi que d'autres opérateurs du réseau INOVERT.

---

## Contexte

Shiptify est un TMS qui permet à des chargeurs de gérer leurs expéditions avec leurs transporteurs. Lorsqu'un transporteur utilise le réseau INOVERT pour recevoir les ordres d'expédition et retourner les confirmations, notre système génère des messages DISPOR (v3.2) et traite les REPORT (v3/v4) en retour.

Nous souhaitons améliorer et pérenniser ces échanges en disposant d'une documentation officielle complète.

---

## Besoins en documentation

### 1. Spécification complète DISPOR v3.2

- Le **fichier de spécification officiel** du message DISPOR v3.2 (ou son successeur)
- La liste des **champs obligatoires et optionnels** avec format et valeurs acceptées
- Les **contraintes de validation** applicables (longueurs maximales, types de données)
- Les **codes d'emballage** (types de palettes, colis, fûts, etc.) reconnus sur le réseau INOVERT
- Les **codes de service** disponibles et leurs conditions d'utilisation

### 2. Spécification complète REPORT v3 et v4

- Le **format officiel** des messages REPORT v3 et v4
- La **liste exhaustive des codes statuts / événements** retournés avec leur signification métier (prise en charge, en cours de livraison, livré, exception, etc.)
- Le **différentiel v3 → v4** : champs ajoutés, modifiés, supprimés
- Y a-t-il une **feuille de route de dépréciation** de v3 ?

### 3. Processus d'intégration pour nouveaux participants

Pour permettre à un nouveau transporteur ou à une nouvelle paire chargeur/transporteur d'intégrer le réseau INOVERT via DISPOR/REPORT :

- Quelle est la **procédure d'homologation** technique ?
- Quels **codes agences** sont nécessaires (côté émetteur et récepteur) ?
- Existe-t-il un **environnement de test** pour valider les messages avant mise en production ?
- Quels sont les délais habituels d'intégration ?

### 4. Documentation DHL France spécifiquement

Dans le cadre de notre intégration avec DHL France sur le réseau INOVERT :

- Y a-t-il des **contraintes ou extensions spécifiques DHL** dans les messages DISPOR/REPORT par rapport au standard INOVERT ?
- DHL utilise-t-il des **codes agences spécifiques** sur le réseau INOVERT ?
- Quel est le contact technique DHL France pour les questions d'intégration INOVERT ?

---

## Accès aux ressources

Nous avons consulté le site https://www.gtff.org/ mais n'avons pas trouvé de documentation technique téléchargeable. Pouvez-vous nous indiquer :

- La **liste des documents de spécification INOVERT** disponibles et comment y accéder ?
- Y a-t-il un **portail dédié aux développeurs/intégrateurs** ?
- Est-il possible d'accéder à des **exemples de messages** DISPOR et REPORT pour validation ?

---

Nous serions très intéressés par tout échange avec votre équipe technique, que ce soit sous forme de documentation, d'une session de travail, ou d'une adhésion au GTF si cela facilite l'accès aux ressources.

Je vous remercie par avance de l'attention portée à cette demande et reste à votre entière disposition.

Dans l'attente de votre retour,

Bien cordialement,

**Aleh Asmalouski**
Ingénieur Logiciel — Intégrations
Shiptify
aleh.asmalouski@shiptify.com
