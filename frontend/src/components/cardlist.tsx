import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TbCoins } from "react-icons/tb";
import { FaCheck, FaEye, FaUser } from "react-icons/fa";
import { Separator } from "@/components/ui/separator";
import { HiExclamationTriangle } from "react-icons/hi2";

const NewsCard = ({ article, onUpdateArticle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editedArticle, setEditedArticle] = useState(article);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedArticle((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name) => {
    setEditedArticle((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSave = () => {
    onUpdateArticle(editedArticle);
    setIsOpen(false);
  };

  return (
    <>
      <Card
        className="my-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsOpen(true)}
      >
        <CardHeader>
          <CardTitle className="text-xl">{article.title}</CardTitle>
          <CardDescription className="text-sm">
            {new Date(article.publish_at).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row justify-between items-center">
            <div className="flex items-center space-x-2">
              <FaCheck
                className={`size-4`}
                style={{ color: article.completed ? "#77dd77" : "#ff6961" }}
              />
              <span>Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <FaEye
                className={`size-4 ${
                  article.reviewed ? "text-blue-500" : "tex-red-400"
                }`}
                style={{
                  color: article.reviewed ? "text-blue-500" : "#ff6961",
                }}
              />
              <span>Reviewed</span>
            </div>
            <div className="flex items-center space-x-2">
              <TbCoins className="size-4 text-yellow-500" />
              <span>{article.points}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <p className="text-sm text-gray-500">{article.source}</p>
          {article.status && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <HiExclamationTriangle className="size-4" />
              <span>{article.status}</span>
            </div>
          )}
          {article.assignedTo && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FaUser className="size-4" />
              <span>{article.assignedTo}</span>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{article.title}</DialogTitle>
            <DialogDescription>
              Published on {new Date(article.publish_at).toLocaleString()} by{" "}
              {article.source}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="mt-4 max-h-[60vh]">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: article.message.content }}
            />
            <br></br>
            <br></br>

            <Separator style={{ height: "4px" }} />
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    name="status"
                    value={editedArticle.status}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Input
                    id="assignedTo"
                    name="assignedTo"
                    value={editedArticle.assignedTo || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="completed"
                  checked={editedArticle.completed}
                  onCheckedChange={() => handleCheckboxChange("completed")}
                />
                <Label htmlFor="completed">Completed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reviewed"
                  checked={editedArticle.reviewed}
                  onCheckedChange={() => handleCheckboxChange("reviewed")}
                />
                <Label htmlFor="reviewed">Reviewed</Label>
              </div>
              <div>
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  name="points"
                  type="number"
                  value={editedArticle.points}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </>
  );
};

const NewsCardList = () => {
  const [news, setNews] = useState([]);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {

    const response = await fetch("https://api.jotiboard.nl/api/news");
    const data = await response.json();
    setNews(sortNews(data));
  };

  const sortNews = (articles) => {
    return articles.sort((a, b) => {
      if (a.completed === b.completed) {
        // If both are completed or both are not completed, sort by publish date (newest first)
        return new Date(b.publish_at) - new Date(a.publish_at);
      }
      // Put non-completed articles first
      return a.completed ? 1 : -1;
    });
  };

  const handleUpdateArticle = async (updatedArticle) => {
    try {
      const response = await fetch(

        `https://api.jotiboard.nl/api/news/${updatedArticle.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedArticle),
        }
      );

      if (response.ok) {
        const updatedNews = news.map((article) =>
          article.id === updatedArticle.id ? updatedArticle : article
        );
        setNews(sortNews(updatedNews));
      } else {
        console.error("Failed to update article");
      }
    } catch (error) {
      console.error("Error updating article:", error);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="space-y-4">
          {news.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              onUpdateArticle={handleUpdateArticle}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default NewsCardList;
