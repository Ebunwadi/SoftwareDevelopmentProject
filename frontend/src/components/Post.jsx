// code by Albert
import { Avatar } from "@chakra-ui/avatar";
import { Image } from "@chakra-ui/image";
import { Box, Flex, Text } from "@chakra-ui/layout";
import { Link, useNavigate } from "react-router-dom";
import Actions from "./Actions";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { formatDistanceToNow } from "date-fns";
import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import QRCode from 'qrcode-svg';
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import postsAtom from "../atoms/postsAtom";
import { Button } from "@chakra-ui/react";

const Post = ({ post, postedBy }) => {
    const [user, setUser] = useState(null);
    const [showQRCode, setShowQRCode] = useState(false);
    const showToast = useShowToast();
    const currentUser = useRecoilValue(userAtom);
    const [posts, setPosts] = useRecoilState(postsAtom);
    const navigate = useNavigate();
    const [qrCode, setQrCode] = useState('');

    useEffect(() => {
        const getUser = async () => {
            try {
                const res = await fetch("/api/users/profile/" + postedBy);
                const data = await res.json();
                if (data.error) {
                    showToast("Error", data.error, "error");
                    return;
                }
                setUser(data);
            } catch (error) {
                showToast("Error", error.message, "error");
                setUser(null);
            }
        };

        getUser();
    }, [postedBy, showToast]);

    const postUrl = `${window.location.origin}/${user?.username}/post/${post._id}`;

    const handleDeletePost = async (e) => {
        try {
            e.preventDefault();
            if (!window.confirm("Are you sure you want to delete this post?")) return;

            const res = await fetch(`/api/posts/${post._id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.error) {
                showToast("Error", data.error, "error");
                return;
            }
            showToast("Success", "Post deleted", "success");
            setPosts(posts.filter((p) => p._id !== post._id));
        } catch (error) {
            showToast("Error", error.message, "error");
        }
    };

    const handleEditPost = (e) => {
        e.preventDefault();
        navigate(`/editPost/${post._id}`, { state: { post } }); // Pass post data to edit page
    };

    const generateQRCode = (e) => {
        e.preventDefault()
        const qr = new QRCode({
            content: postUrl,  // Use the actual post URL
            padding: 4,
            width: 128,
            height: 128,
            color: "#000000",
            background: "#ffffff",
            ecl: "M"
        }).svg();
        setQrCode(qr);
        setShowQRCode(!showQRCode);
    };

    if (!user) return null;

    return (
        <Link to={`/${user.username}/post/${post._id}`}>
        <Box borderWidth="1px" borderRadius="lg" p={4} mb={4}>
            <Flex gap={3} mb={4} py={5}>
                <Flex flexDirection={"column"} alignItems={"center"}>
                    <Avatar
                        size='md'
                        name={user.name}
                        src={user?.profilePic}
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(`/${user.username}`);
                        }}
                    />
                    <Box w='1px' h={"full"} bg='gray.light' my={2}></Box>
                    <Box position={"relative"} w={"full"}>
                        {post.replies.length === 0 && <Text textAlign={"center"}>🥱</Text>}
                        {post.replies[0] && (
                            <Avatar
                                size='xs'
                                name='John doe'
                                src={post.replies[0].userProfilePic}
                                position={"absolute"}
                                top={"0px"}
                                left='15px'
                                padding={"2px"}
                            />
                        )}

                        {post.replies[1] && (
                            <Avatar
                                size='xs'
                                name='John doe'
                                src={post.replies[1].userProfilePic}
                                position={"absolute"}
                                bottom={"0px"}
                                right='-5px'
                                padding={"2px"}
                            />
                        )}

                        {post.replies[2] && (
                            <Avatar
                                size='xs'
                                name='John doe'
                                src={post.replies[2].userProfilePic}
                                position={"absolute"}
                                bottom={"0px"}
                                left='4px'
                                padding={"2px"}
                            />
                        )}
                    </Box>
                </Flex>
                <Flex flex={1} flexDirection={"column"} gap={2}>
                    <Flex justifyContent={"space-between"} w={"full"}>
                        <Flex w={"full"} alignItems={"center"}>
                            <Text
                                fontSize={"sm"}
                                fontWeight={"bold"}
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate(`/${user.username}`);
                                }}
                            >
                                {user?.username}
                            </Text>
                            <Image src='/verified.png' w={4} h={4} ml={1} />
                        </Flex>
                        <Flex gap={4} alignItems={"center"}>
                            <Text fontSize={"xs"} width={36} textAlign={"right"} color={"gray.light"}>
                                {formatDistanceToNow(new Date(post.createdAt))} ago
                            </Text>

                            {currentUser?._id === user._id && (
                                <>
                                    <DeleteIcon size={20} onClick={handleDeletePost} style={{ cursor: "pointer" }} />
                                    <EditIcon size={20} onClick={handleEditPost}  style={{ cursor: "pointer" }}/>
                                    <Button colorScheme="blue" onClick={generateQRCode} style={{ cursor: "pointer" }}>
                                        {showQRCode ? "Hide QR Code" : "Generate QRCode for this post"}
                                    </Button>
                                </>
                            )}
                        </Flex>
                    </Flex>

                    <Text fontSize={"sm"}>{post.text}</Text>
                    {post.img && (
                        <Box borderRadius={6} overflow={"hidden"} border={"1px solid"} borderColor={"gray.light"}>
                            <Image src={post.img} w={"full"} />
                        </Box>
                    )}

                    <Flex gap={3} my={1}>
                        <Actions post={post} />
                    </Flex>

                    {showQRCode && (
                        <Box mt={4} textAlign="center">
                            <div dangerouslySetInnerHTML={{ __html: qrCode }} /> {/* Render QR Code */}
                            <Text mt={2}>Scan the above qr code to view the post</Text>
                        </Box>
                    )}
                </Flex>
            </Flex>
        </Box>
     </Link>
    );
};

export default Post;
