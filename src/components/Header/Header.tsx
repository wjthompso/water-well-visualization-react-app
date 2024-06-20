import { FC } from "react";
import UCSBBrenLogo from "../../assets/UCSBBrenLogo.svg";

const Header: FC = () => {
    return (
        <header className="py-4 h-[89px] flex items-center bg-[#2F2E2E]">
            <div className="container flex items-center mx-auto">
                <h1 className="flex items-center text-2xl font-bold text-white">
                    <img
                        src={UCSBBrenLogo}
                        alt="UCSB Bren Logo"
                    />
                </h1>
                <div className="flex flex-col ml-20">
                    <h1 className="text-3xl text-white font-[600] font-lora">
                        Water Well Geologic Observations
                    </h1>
                    <h3 className="ml-1 text-lg text-white font-lora">
                        Click on a well to see the different materials
                        encountered.
                    </h3>
                </div>
            </div>
        </header>
    );
};

export default Header;
