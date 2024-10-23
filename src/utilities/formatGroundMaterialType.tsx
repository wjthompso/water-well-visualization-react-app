export const formatGroundMaterialType = (name: string) => {
    const [firstPart, secondPart] = name.split(":");
    if (!secondPart) {
        return <b>{firstPart}</b>;
    }
    return (
        <>
            <b>{firstPart}</b>, {secondPart}
        </>
    );
};
