import React from "react";

const GroundMaterialComponent: React.FC<{ name: string }> = ({ name }) => {
    const [firstPart, secondPart] = name.split(":");

    return (
        <p id="dominant-lithology-type">
            <b>{firstPart}</b>
            {secondPart && `, ${secondPart}`}
        </p>
    );
};

export default GroundMaterialComponent;
