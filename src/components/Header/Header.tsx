import { FC } from "react";
import NSFLogo from "../../assets/NSFLogo.png";
import UCSBBrenLogo from "../../assets/UCSBBrenLogo.svg";

const Header: FC = () => {
    return (
        <header className="py-4 h-[3.5rem] w-full md:h-[89px] flex items-center bg-headerBackgroundColor border-b-[0.5px] border-[#808080]">
            <div className="flex items-center w-full px-4">
                <a
                    href="https://bren.ucsb.edu/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img
                        id="UCSBBrenLogo"
                        src={UCSBBrenLogo}
                        alt="UCSB Bren Logo"
                        className="flex-shrink-0 mr-4 w-[10rem] h-[4rem] md:w-[15rem] md:h-[3.5rem]"
                    />
                </a>
                <div className="flex-grow"></div>
                <div
                    id="header-text"
                    className="flex-col items-center hidden text-center md:flex "
                >
                    <h1 className="overflow-hidden text-3xl font-semibold text-white font-lora whitespace-nowrap text-ellipsis">
                        Water Well Geologic Observations
                    </h1>
                    <h3 className="overflow-hidden text-lg text-white font-lora whitespace-nowrap text-ellipsis">
                        Click on a well to see the different materials
                        encountered.
                    </h3>
                </div>
                <div className="flex-grow"></div>
                <div
                    id="element-the-same-width-as-the-logo"
                    className="mr-4 flex-shrink-0 max-w-[15rem] h-[3.5rem]"
                ></div>
                <img
                    id="NSFLogo"
                    src={NSFLogo}
                    alt="NSF Logo"
                    className="flex-shrink-0 w-[3rem] h-[3rem] md:w-[3.5rem] md:h-[3.5rem]"
                />
            </div>
        </header>
    );
};

export default Header;
