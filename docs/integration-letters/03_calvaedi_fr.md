# Lettre — CalvaEDI (Calvacom)
**À:** Willy Berthelot (Directeur Général) — via formulaire https://www.calvaedi.com/calvaedi-contactez-nous-11.htm
**Ou par téléphone:** +33 (0)1 43 13 31 31
**Objet:** Demande de documentation technique — Intégration EDIFACT DISPOR/REPORT — Shiptify × CalvaEDI / XPO

--- 

Monsieur Berthelot,

Je me permets de vous contacter au nom de **Shiptify**, plateforme TMS française, concernant notre intégration EDIFACT active avec le réseau XPO Logistics France, pour laquelle CalvaEDI assure la médiation EDI.

Je suis **Aleh Asmalouski**, ingénieur logiciel chez Shiptify, responsable de nos intégrations EDI. Nous échangeons actuellement des messages EDIFACT DISPOR (v3.2) vers CalvaEDI pour les envois de nos clients chargeurs, et recevons les messages REPORT (v3 et v4) en retour pour les confirmations de prise en charge et les mises à jour de suivi.

---

## Contexte de notre intégration

| Direction | Message | Version | Objet |
|---|---|---|---|
| Shiptify → CalvaEDI | DISPOR | 3.2 | Ordre de dispatchement / réservation |
| CalvaEDI → Shiptify | REPORT | v3 / v4 | Confirmation + statuts de suivi |

L'intégration fonctionne via échange de fichiers FTP/SFTP. Nous disposons d'un environnement de recette (`calvacom_qa`) sur notre plateforme de staging, avec l'agence EDIFACT `CALVACOM_QA`.

---

## Besoins en documentation

Malgré une intégration opérationnelle en production, notre équipe **manque de spécification formelle** pour évoluer et maintenir l'intégration dans les meilleures conditions. Voici nos besoins précis :

### 1. Spécification complète du message DISPOR v3.2

Dans le contexte de votre réseau (CalvaEDI / XPO France) :

- La liste de **tous les segments et sous-segments** du message DISPOR v3.2 avec leur signification et leurs valeurs acceptées
- La distinction **obligatoire / optionnel** pour chaque champ
- Les **contraintes spécifiques CalvaEDI** qui s'appliquent au-delà du standard INOVERT (valeurs imposées, longueurs, codes propriétaires)
- Les **codes de type d'emballage** acceptés (europalettes, CHEP, etc.)
- Les **codes de service** disponibles (standard, express, personnalisés)

### 2. Spécification du message REPORT (v3 et v4)

- Le **format complet** des messages REPORT v3 et v4 retournés par CalvaEDI
- La **liste exhaustive des codes statuts** et événements de suivi avec leur signification
- Le **différentiel** entre v3 et v4 : quels champs sont ajoutés ou modifiés en v4 ?
- Est-ce que v3 sera déprécié ? Si oui, quel est le calendrier de migration vers v4 ?
- La gestion des **rejets / messages d'erreur** dans les REPORT

### 3. Processus POD (Proof of Delivery)

- Comment récupérer les **preuves de livraison (POD)** via CalvaEDI ?
- Y a-t-il un endpoint ou un flux FTP dédié aux POD ?
- Format et contenu des documents POD fournis

### 4. Environnement de recette / QA

Notre environnement de staging dispose déjà de l'agence EDIFACT `CALVACOM_QA`. Nous avons besoin de confirmer :

- L'environnement QA est-il pleinement fonctionnel et à jour ?
- Quelles sont les **credentials FTP** actuelles pour l'environnement QA ?
- Y a-t-il des différences de comportement entre l'env QA et la production ?
- Comment simuler les réponses REPORT depuis votre côté en QA ?

### 5. Onboarding de nouveaux transporteurs

Pour intégrer de nouveaux transporteurs utilisant le réseau CalvaEDI / XPO :

- Quelle est la **procédure d'onboarding** technique ?
- Quels codes agence EDIFACT sont nécessaires ?
- Quel est le délai habituel de mise en place ?

---

## Proposition de collaboration

Nous serions ravis d'organiser un **appel technique** avec votre équipe afin de partager notre implémentation actuelle, identifier les points à améliorer, et obtenir vos retours. Nous pouvons également soumettre des exemples de messages DISPOR générés côté Shiptify pour validation.

Je reste à votre disposition pour tout échange et vous remercie par avance de l'attention portée à cette demande.

Dans l'attente de votre retour,

Bien cordialement,

**Aleh Asmalouski**
Ingénieur Logiciel — Intégrations
Shiptify
aleh.asmalouski@shiptify.com
