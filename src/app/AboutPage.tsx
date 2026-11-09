import { questions } from '../content';

export function AboutPage() {
  const byStatus = questions.reduce<Record<string, number>>((a, q) => ((a[q.answerStatus] = (a[q.answerStatus] ?? 0) + 1), a), {});
  return (
    <div className="stack">
      <div className="page-head">
        <h1>À propos, sources et confidentialité</h1>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>D’où viennent les questions ?</h2>
        <p>
          Des retranscriptions d’anciens examens du secteur digestif (UCL), rédigées de mémoire par des étudiant·e·s après les examens : compilation 2016-2025 et
          retranscriptions de janvier et août 2026.
        </p>
        <p>
          <strong>Aucune de ces réponses n’est un corrigé officiel.</strong> Chaque question affiche le niveau de fiabilité de sa réponse :
        </p>
        <ul>
          <li>Réponse proposée (archives) : {byStatus.proposed ?? 0}</li>
          <li>Réponse discutée ou contradictoire : {byStatus.disputed ?? 0}</li>
          <li>Réponse déduite, à vérifier : {byStatus.inferred ?? 0}</li>
          <li>Pas de réponse dans les archives : {byStatus.unavailable ?? 0}</li>
        </ul>
        <p>
          Les formulations d’origine sont conservées, y compris leurs imprécisions. Les prénoms des étudiant·e·s retranscripteurs ont été retirés.
        </p>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Cours et explications</h2>
        <p>
          Les archives ne contiennent pas de cours. Les leçons, indices et explications sont des <strong>compléments pédagogiques</strong>, toujours signalés comme
          tels (encadrés jaunes « à valider ») tant qu’ils n’ont pas été relus. Ils ne remplacent pas le cours officiel. Aucune référence bibliographique n’est
          inventée.
        </p>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Vos données</h2>
        <ul>
          <li>Votre progression reste dans ce navigateur (IndexedDB). Elle n’est envoyée nulle part.</li>
          <li>Elle n’est pas synchronisée entre vos appareils : utilisez « Ma progression → Sauvegarde ».</li>
          <li>Effacer les données du navigateur efface votre progression : sauvegardez régulièrement.</li>
          <li>Ce site n’utilise ni compte, ni publicité, ni outil de mesure d’audience, ni intelligence artificielle en ligne.</li>
        </ul>
        <p className="small muted">
          Le site est hébergé gratuitement sur GitHub Pages : il est accessible à toute personne qui connaît son adresse. Il ne contient aucune donnée personnelle.
        </p>
      </div>
    </div>
  );
}
