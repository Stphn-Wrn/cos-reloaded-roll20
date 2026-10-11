# Curse of Strahd: Reloaded pour Roll20

[English version](README.md)

Un script Mod Roll20 qui importe le guide [Curse of Strahd: Reloaded](https://www.strahdreloaded.com) de DragnaCarta dans votre partie sous forme de handouts reliés, en anglais ou en français.

C'est la version Roll20 de [cos-reloaded-importer](https://github.com/Stphn-Wrn/cos-reloaded-importer) pour Foundry VTT. Les scripts Roll20 ne peuvent rien télécharger : le guide est donc inclus dans le script, avec l'accord de son auteur.

## Ce que fait le script

- Tout le guide en un millier de handouts environ, numérotés dans l'ordre du guide : `12 Arc A - Évasion de la Maison de la Mort`, `12.02 A2. La Maison de la Mort`, `12.02.03.04 Bibliothèque`.
- Un handout par section, et un par pièce ou sous-partie quand le guide y renvoie : chaque lien ouvre le bon endroit.
- Chaque arc et chaque section listent leurs parties sous forme de liens, et chaque partie renvoie vers son parent.
- Texte à lire, encadrés, tableaux, blocs de statistiques et images sont mis en forme.
- Relancer l'import après une mise à jour ne réécrit que les handouts qui ont changé.

## Prérequis

Roll20 Pro pour le créateur de la partie : les scripts Mod sont réservés aux comptes Pro.

## Installation

1. Téléchargez `cos-reloaded-roll20-fr.js` (français) ou `cos-reloaded-roll20-en.js` (anglais) dans la [dernière version](https://github.com/Stphn-Wrn/cos-reloaded-roll20/releases/latest).
2. Sur la page de votre partie, ouvrez **Settings > Mod (API) Scripts** et cliquez sur **New Script**.
3. Collez tout le contenu du fichier et cliquez sur **Save Script**.

## Utilisation

Dans la partie, tapez `!cosr import` dans le chat. Le MJ reçoit un message privé à la fin de l'import.

Les handouts ne sont visibles que par le MJ. Utilisez **Show to Players** pour en partager un.

## Mise à jour

Remplacez le contenu du script par la nouvelle version, enregistrez, puis retapez `!cosr import`. Un handout modifié à la main est écrasé si le guide l'a changé : gardez vos notes dans vos propres handouts.

Roll20 range le Journal par ordre alphabétique au moment où un handout est créé. Si vous avez installé une version précédente avec d'autres noms, supprimez ses handouts avant d'importer pour que tout soit dans l'ordre.

## Version française

Le script français contient tout le guide traduit, sauf le journal des modifications, avec la même organisation.

## Crédits

Curse of Strahd: Reloaded est écrit par DragnaCarta et publié gratuitement dans le cadre de la Fan Content Policy de Wizards of the Coast. Si le guide vous est utile, [soutenez l'auteur](https://www.strahdreloaded.com).

Ce script n'est affilié ni à DragnaCarta, ni à Wizards of the Coast, ni à Roll20.
