import "./FinePrint.css";

const FinePrint = () => {
    return (
        <footer className="box-border max-w-[calc(19rem-2rem)] text-sm leading-relaxed text-white">
            <p className="mb-2">
                This research was supported by funding from the Zegar Family
                Foundation. Scott Jasechko and Merhawi GebreEgziabher
                GebreMichael acknowledge the
                <a
                    href="https://doi.org/10.25497/D7159W"
                    className="ml-1 text-blue-500 hover:text-blue-700"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Jack and Laura Dangermond Preserve
                </a>
                , the Point Conception Institute, and the Nature Conservancy for
                their support of this research.
            </p>
            <p className="mb-2">
                This material is based on work supported by the National Science
                Foundation under grant nos. EAR-2048227 (Scott Jasechko) and
                EAR-2234213 (to Debra Perrone).
            </p>
            To learn more about our research:
            <ul className="mb-2 list-disc list-inside custom-list">
                <li>
                    <a
                        href="https://www.jasechko.com/"
                        className="-ml-2 text-blue-500 underline hover:text-blue-700"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        www.jasechko.com
                    </a>
                </li>
                <li>
                    <a
                        href="https://www.mgebreegziabher.com/"
                        className="-ml-2 text-blue-500 underline hover:text-blue-700"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        www.mgebreegziabher.com
                    </a>
                </li>
                <li>
                    <a
                        href="https://www.debraperrone.com/"
                        className="-ml-2 text-blue-500 underline hover:text-blue-700"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        www.debraperrone.com
                    </a>
                </li>
            </ul>
            <p className="italic">
                Website design by William Overbye-Thompson.
            </p>
        </footer>
    );
};

export default FinePrint;
