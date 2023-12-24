import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'React',
    description: (
      <>
        Frontend framework. React is a JavaScript library for building user interfaces.
      </>
    ),
  },
  {
    title: 'Leva',
    description: (
      <>
        Leva is a React library that allows you to create controls for your variables in a separate panel.
      </>
    ),
  },
  {
    title: 'CodeMirror',
    description: (
      <>
        CodeMirror is a code editor implemented in JavaScript for the browser.
      </>
    ),
  },
  {
    title: 'WebAudio API',
    description: (
      <>
        WebAudio API is a web standard for processing and synthesizing audio in the browser.
      </>
    ),
  },
  {
    title: 'WebGPU API',
    description: (
      <>
        WebGPU API is a future web standard for massively parallel GPU programming in the browser.
      </>
    ),
  },
  {
    title: 'WebWorkers API',
    description: (
      <>
        WebWorkers API is a web standard for running JavaScript in a background thread.
      </>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <Heading as="h2">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
