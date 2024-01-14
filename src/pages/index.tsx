import React, { useEffect, useState } from "react";
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
    const [currentGPU, setCurrentGPU] = useState<GPUAdapterInfo>(
        {
            __brand: "GPUAdapterInfo",
            vendor: '',
            architecture: '',
            device: '',
            description: ''
        }
    );

    useEffect(() => {
      loadCurrentGPUDescription()

      async function loadCurrentGPUDescription() {
          const adapter = await navigator.gpu.requestAdapter();
          setCurrentGPU(await adapter.requestAdapterInfo());
      }
    }, []);

  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">Your Current GPU:</p>
          <p>
            vendor: {currentGPU.vendor}<br />
            architecture: {currentGPU.architecture}<br />
            device: {currentGPU.device}<br />
            description: {currentGPU.description}
        </p>
      </div>
    </header>
  );
}

export default function Home(): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`WebGPU Sound`}
      description="www.webgpusound.com>">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
